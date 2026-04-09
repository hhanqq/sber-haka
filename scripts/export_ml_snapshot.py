import argparse
import json
from datetime import date
from pathlib import Path

import pandas as pd
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import silhouette_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler


def build_dataset(n: int = 5000, seed: int = 42) -> pd.DataFrame:
    import numpy as np

    np.random.seed(seed)
    data = {
        "client_id": range(n),
        "age": np.random.choice(range(60, 81), n),
        "generation": np.where(np.random.choice([0, 1], n, p=[0.55, 0.45]), "new", "old"),
        "digital_literacy": np.where(
            np.random.choice([0, 1], n, p=[0.55, 0.45]),
            np.random.normal(6, 1.5, n).clip(1, 10),
            np.random.normal(3, 1.3, n).clip(1, 10),
        ),
        "fear_digital": np.random.normal(5, 2, n).clip(1, 10),
        "trust_branch": np.where(
            np.random.choice([0, 1], n, p=[0.55, 0.45]),
            np.random.normal(5, 1.5, n).clip(1, 10),
            np.random.normal(8, 1.2, n).clip(1, 10),
        ),
        "need_human": np.where(
            np.random.choice([0, 1], n, p=[0.55, 0.45]),
            np.random.normal(4, 1.5, n).clip(1, 10),
            np.random.normal(7, 1.2, n).clip(1, 10),
        ),
        "awareness_easy_transfer": np.random.choice([0, 1], n, p=[0.5, 0.5]),
        "bank_loyalty": np.random.normal(5, 2, n).clip(1, 10),
    }
    df = pd.DataFrame(data)
    df["fear_digital"] = (10 - df["digital_literacy"] + np.random.normal(0, 1, n)).clip(1, 10)
    prob = (
        0.2
        + 0.06 * df["awareness_easy_transfer"]
        - 0.03 * df["fear_digital"]
        - 0.02 * df["trust_branch"]
        + np.random.normal(0, 0.08, n)
    ).clip(0.05, 0.85)
    df["will_transfer"] = np.random.binomial(1, prob, n)
    return df


def main() -> None:
    parser = argparse.ArgumentParser(description="Export ML insights snapshot from the SBER notebook logic")
    parser.add_argument("--output", required=True, help="Path to output JSON snapshot")
    args = parser.parse_args()

    df = build_dataset()
    seg_features = ["fear_digital", "trust_branch", "need_human", "digital_literacy"]
    scaler = StandardScaler()
    x_seg = scaler.fit_transform(df[seg_features])

    silhouettes = {}
    for k in range(2, 7):
        km = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = km.fit_predict(x_seg)
        silhouettes[k] = silhouette_score(x_seg, labels)

    k = max(silhouettes, key=silhouettes.get)
    km = KMeans(n_clusters=k, random_state=42, n_init=10)
    df["segment"] = km.fit_predict(x_seg)

    segment_names = {
        0: "Цифровой пессимист",
        1: "Адаптивный новичок",
        2: "Страх техники",
        3: "Уверенный пользователь техники",
    }
    df["segment_name"] = df["segment"].map(segment_names)

    features = [
        "age",
        "fear_digital",
        "trust_branch",
        "need_human",
        "digital_literacy",
        "awareness_easy_transfer",
        "bank_loyalty",
    ]
    df["is_new"] = (df["generation"] == "new").astype(int)
    features.append("is_new")

    x = df[features]
    y = df["will_transfer"]
    x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.3, random_state=42)

    rf = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
    rf.fit(x_train, y_train)

    importance = (
        pd.DataFrame({"feature": features, "importance": rf.feature_importances_})
        .sort_values("importance", ascending=False)
        .reset_index(drop=True)
    )

    problem_segments = [0, 2]
    df_prob = df[df["segment"].isin(problem_segments)].copy()
    base_rate = rf.predict_proba(df_prob[features])[:, 1].mean()

    def simulate(effect_dict: dict[str, float]) -> float:
        df_sim = df_prob.copy()
        for feat, mult in effect_dict.items():
            df_sim[feat] = (df_sim[feat] * mult).clip(1, 10)
        return rf.predict_proba(df_sim[features])[:, 1].mean()

    scenarios = {
        "Обучение (снижение страха на 40%)": {"fear_digital": 0.6},
        "Клуб по интересам (меньше нужен человек)": {"need_human": 0.7},
        "Комбо (обучение + клуб)": {"fear_digital": 0.6, "need_human": 0.7},
    }

    summary = {
        "source": "export_ml_snapshot.py",
        "sample_size": len(df),
        "generated_at": str(date.today()),
        "segments": [],
        "top_factors": [],
        "scenario_effects": [],
        "recommendations": [
            "Запустить обучение и клубы по интересам как связанный сервисный пакет.",
            "Поднимать awareness_easy_transfer через простые объяснения и сопровождение.",
            "Для проблемных сегментов сохранять офлайн-опору и кураторский маршрут.",
        ],
    }

    for segment_name, segment_df in df.groupby("segment_name"):
        summary["segments"].append(
            {
                "name": segment_name,
                "share_percent": round(len(segment_df) / len(df) * 100, 1),
                "barriers": [
                    f"fear_digital={segment_df['fear_digital'].mean():.1f}",
                    f"trust_branch={segment_df['trust_branch'].mean():.1f}",
                    f"need_human={segment_df['need_human'].mean():.1f}",
                    f"digital_literacy={segment_df['digital_literacy'].mean():.1f}",
                ],
            }
        )

    for _, row in importance.head(5).iterrows():
        summary["top_factors"].append(
            {
                "feature": row["feature"],
                "importance": round(float(row["importance"]), 4),
                "insight": f"Фактор {row['feature']} входит в топ драйверов решения о переводе пенсии.",
            }
        )

    for name, effect in scenarios.items():
        new_rate = simulate(effect)
        summary["scenario_effects"].append(
            {"name": name, "delta_pp": round((new_rate - base_rate) * 100, 1)}
        )

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as file:
        json.dump(summary, file, ensure_ascii=False, indent=2)

    print(f"saved snapshot to {output_path}")


if __name__ == "__main__":
    main()

