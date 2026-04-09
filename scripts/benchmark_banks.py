import argparse
import json
import os
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from openai import OpenAI
from selenium import webdriver
from selenium.common.exceptions import WebDriverException
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager


BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_TARGETS = Path(__file__).resolve().parent / "bank_targets.json"
DEFAULT_OUTPUT = BASE_DIR / "artifacts" / "benchmark_results.json"

PROMPT = """
Ты senior-аналитик по CX для аудитории 60+ в банковской сфере.
Оцени страницу банка для сценария перевода пенсии.

Верни только JSON такого вида:
{
  "total_score": 0-100,
  "score_breakdown": {
    "clarity": 0-100,
    "trust": 0-100,
    "omnichannel": 0-100,
    "family_support": 0-100,
    "education": 0-100,
    "non_financial_value": 0-100
  },
  "strengths": ["..."],
  "gaps": ["..."],
  "summary": "...",
  "evidence_excerpt": "..."
}

Правила:
- оценивай только по переданному тексту страницы;
- если на странице нет признака критерия, снижай оценку;
- summary максимум 120 слов;
- strengths и gaps по 3-5 пунктов;
- evidence_excerpt максимум 500 символов;
- ориентируйся на потребности 60+: понятность, безопасность, человеческая поддержка, мягкое обучение.
""".strip()


def load_targets(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def build_driver() -> webdriver.Chrome:
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1440,2200")
    options.add_argument(
        "--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )
    service = Service(ChromeDriverManager().install())
    return webdriver.Chrome(service=service, options=options)


def extract_visible_text(driver: webdriver.Chrome, url: str, wait_seconds: float = 3.0) -> str:
    driver.get(url)
    time.sleep(wait_seconds)
    script = """
    const blacklist = ['script', 'style', 'noscript', 'svg', 'img'];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const chunks = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentElement;
      if (!parent) continue;
      if (blacklist.includes(parent.tagName.toLowerCase())) continue;
      const text = node.textContent.replace(/\\s+/g, ' ').trim();
      if (text.length > 0) chunks.push(text);
    }
    return chunks.join('\\n');
    """
    return driver.execute_script(script)


def fallback_visible_text(url: str) -> str:
    response = requests.get(
        url,
        timeout=30,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            )
        },
    )
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    for tag in soup(["script", "style", "noscript", "svg"]):
        tag.decompose()
    return soup.get_text("\n", strip=True)


def analyze_page(client: OpenAI, model: str, target: dict, page_text: str) -> dict:
    truncated = page_text[:18000]
    response = client.chat.completions.create(
        model=model,
        temperature=0.2,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": PROMPT},
            {
                "role": "user",
                "content": (
                    f"Банк: {target['name']}\n"
                    f"URL: {target['url']}\n"
                    f"Тип страницы: {target.get('page_type', 'страница для пенсионеров')}\n\n"
                    f"Текст страницы:\n{truncated}"
                ),
            },
        ],
    )
    content = response.choices[0].message.content
    parsed = json.loads(content)
    parsed["source_name"] = target["name"]
    parsed["source_url"] = target["url"]
    parsed["page_type"] = target.get("page_type", "страница для пенсионеров")
    parsed["model_name"] = model
    return parsed


def send_to_backend(results: list[dict], backend_url: str) -> None:
    for result in results:
        response = requests.post(f"{backend_url.rstrip('/')}/api/benchmarks/results", json=result, timeout=60)
        response.raise_for_status()


def main() -> None:
    parser = argparse.ArgumentParser(description="Selenium benchmark for Russian bank pension pages")
    parser.add_argument("--targets", default=str(DEFAULT_TARGETS), help="Path to JSON targets")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT), help="Path to save JSON results")
    parser.add_argument("--model", default=os.getenv("PROXYAPI_MODEL", "gpt-4o-mini"))
    parser.add_argument("--backend-url", default=os.getenv("BACKEND_API_URL", ""))
    parser.add_argument("--base-url", default=os.getenv("PROXYAPI_BASE_URL", "https://api.proxyapi.ru/openai/v1"))
    args = parser.parse_args()

    api_key = os.getenv("PROXYAPI_KEY")
    if not api_key:
        raise SystemExit("PROXYAPI_KEY is required")

    targets = load_targets(Path(args.targets))
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    client = OpenAI(api_key=api_key, base_url=args.base_url)

    driver = None
    results = []
    try:
        driver = build_driver()
    except WebDriverException:
        driver = None

    for target in targets:
        try:
            if driver is not None:
                page_text = extract_visible_text(driver, target["url"])
            else:
                page_text = fallback_visible_text(target["url"])
            analysis = analyze_page(client, args.model, target, page_text)
            results.append(analysis)
            print(f"[ok] {target['name']} => {analysis['total_score']}")
        except Exception as exc:
            print(f"[error] {target['name']}: {exc}")

    if driver is not None:
        driver.quit()

    with output_path.open("w", encoding="utf-8") as file:
        json.dump(results, file, ensure_ascii=False, indent=2)

    if args.backend_url and results:
        send_to_backend(results, args.backend_url)

    print(f"saved {len(results)} results to {output_path}")


if __name__ == "__main__":
    main()
