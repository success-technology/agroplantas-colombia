# Ampliar el dataset con nuevos cultivos

Esta guía explica cómo agregar cultivos nuevos (café, cacao, yuca, banano/plátano...)
al modelo, combinando varios datasets de Kaggle en un solo entrenamiento.

## 1. Descargar los datasets

| Cultivo | Dataset recomendado | Dónde |
|---|---|---|
| Yuca | Cassava Leaf Disease Classification | kaggle.com/competitions/cassava-leaf-disease-classification |
| Café | Coffee leaf diseases (JMuBEN/JMuBEN2) o RoCoLe | Buscar "coffee leaf disease" en Kaggle |
| Cacao | Cocoa Diseases — **verificar formato antes de descargar** (ver advertencia abajo) | Buscar "cacao disease" / "cocoa disease" en Kaggle |
| Banano/Plátano | BananaLSD (Banana Leaf Spot Diseases) | Buscar "bananalsd" en Kaggle |

> ⚠️ **Cacao**: el dataset "Cocoa Diseases (YOLOv4)" viene en formato de detección
> de objetos (imágenes + cajas delimitadoras en `.txt`), no en carpetas por clase.
> El script `prepare_dataset.py` actual **no convierte ese formato**. Antes de
> descargarlo, revisa si tiene una versión "classification" con carpetas
> `healthy/`, `black_pod/`, `monilia/`. Si no la encuentras, dime y escribo un
> script aparte que recorte las imágenes según las cajas delimitadoras.

## 2. Organizar las carpetas

Descomprime cada dataset dentro de `data/raw/`, uno por cultivo:

```
data/raw/
├── yuca/
│   ├── train_images/       ← todas las fotos, sueltas
│   └── train.csv           ← image_id,label
├── cafe/
│   ├── healthy/
│   ├── rust/
│   └── ...
├── cacao/
│   ├── healthy/
│   ├── black_pod/
│   └── ...
└── platano/
    ├── healthy/
    ├── sigatoka/
    └── ...
```

Los nombres exactos de subcarpetas varían según el dataset — no hace falta que
coincidan exactamente con el manifiesto, porque el emparejamiento es flexible
(ignora mayúsculas, espacios y guiones). Aun así, revisa el resultado del
`--dry-run` (paso 3) para confirmar.

## 3. Revisar con `--dry-run` (sin copiar nada todavía)

```powershell
python scripts/prepare_dataset.py --manifest data/dataset_manifest.json --dry-run
```

Esto imprime cada clase detectada y cuántas imágenes tiene, y avisa si alguna
carpeta o etiqueta no encontró mapeo en el manifiesto (`dataset_manifest.json`).
Si ves avisos de "sin mapeo", abre el manifiesto y agrega la entrada que falte
en el `label_map` correspondiente.

## 4. Ejecutar de verdad

Cuando el dry-run se vea correcto:

```powershell
python scripts/prepare_dataset.py --manifest data/dataset_manifest.json
```

Esto genera `data/processed/{train,val,test}/<Cultivo>___<Estado>/` igual que
antes, combinando el dataset original (si lo agregas también como fuente) con
los nuevos.

> Si quieres conservar el modelo de 38 clases actual y solo ENTRENAR con los
> cultivos nuevos por separado primero (para probar más rápido), simplemente
> deja en el manifiesto solo las fuentes nuevas. Si quieres el modelo final
> con las 38 clases + las nuevas juntas, agrega también una fuente `type:
> "folder"` apuntando a tu carpeta actual de PlantVillage.

## 5. Entrenar

Sin cambios respecto a como ya lo haces — `train.py` no necesitó modificarse,
detecta automáticamente cuántas clases hay:

```powershell
python scripts/train.py --data data/processed --epochs 15
python scripts/evaluate.py
```

Con más clases y más datos, considera subir `--epochs` (por ejemplo a 20-25) y
vigilar `training_metrics.json` para ver si el modelo sigue mejorando o ya se
estabilizó.

## 6. Pendiente después de reentrenar

El backend (`plant_knowledge.py`, `recommendations.py`, `supported_species.py`,
`backend/data/plant_catalog.json`) necesita una entrada por cada clase nueva
(nombre en español, tratamiento, prevención, etc.) o esas pantallas saldrán
vacías para los cultivos nuevos. Eso lo resolvemos en otra sesión, después de
confirmar que el modelo entrena bien con los datos nuevos.