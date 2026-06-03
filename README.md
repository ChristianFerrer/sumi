# Sumi 🌱

> **Sumi** = *"bueno / bonito"* en quechua.
> La app peruana que no solo te advierte: te dice **qué consumir en su lugar**.

Sumi es la versión peruana de [Yuka](https://yuka.io). Escaneas el código de
barras de un producto y Sumi te da una **nota de 0 a 100**, te explica **por qué**,
te muestra los **octógonos de advertencia** que le corresponden por ley, y
(próximamente) te propone una **alternativa más saludable disponible en el Perú**.

## El problema

Desde 2019 los productos peruanos llevan **octógonos negros** ("ALTO EN AZÚCAR",
"ALTO EN SODIO", etc.) por la Ley N.º 30021. Funcionaron al inicio, pero el
consumidor los normalizó y los ignora. El octógono dice *"esto es malo"* pero
**deja a la persona sola frente a la góndola**: no le dice qué hacer.

**Sumi cierra ese vacío:** traduce → explica → **resuelve** proponiendo una mejor opción.

---

## Cómo obtiene los datos de cada producto

Esta es la pieza crítica. Sumi usa una estrategia en capas (de la más barata a la más rica):

```
Escaneo de código de barras
        │
        ▼
 ¿Está en MI base (Supabase)?  ──Sí──►  mostrar resultado
        │ No
        ▼
 Consultar Open Food Facts  ──Encontrado──►  guardar en Supabase + mostrar
        │ No encontrado
        ▼
 Flujo colaborativo: usuario fotografía la etiqueta → OCR/IA extrae nutrientes
        │
        ▼
 Calcular Sumi-Score + octógonos → guardar → mostrar
```

1. **Open Food Facts (OFF)** — base abierta y gratuita, +3M de productos.
   Primera fuente. ⚠️ Exige header `User-Agent` (si no, responde 403) y su
   cobertura de productos peruanos es baja.
2. **Crowdsourcing con foto + IA** — cuando OFF no tiene el producto, el usuario
   fotografía la tabla nutricional y una IA (Claude visión) extrae los datos.
   Cada escaneo hace crecer la base — el círculo virtuoso de Yuka.
3. **Base propia (Supabase)** — caché + activo defensivo. Con el tiempo, la mejor
   base de productos peruanos del país.
4. **Enriquecimiento oficial** (fases siguientes): GS1 Perú (prefijo EAN `775`),
   DIGESA/Registro Sanitario, catálogos de retailers para precios y alternativas.

---

## El motor Sumi-Score

Inspirado en Yuka (**60% nutrición + 30% aditivos + 10% procesamiento**), pero
**adaptado al Perú**: los octógonos de la Ley 30021 *limitan la nota máxima*.

| Componente | Peso | Implementación |
|---|---|---|
| Calidad nutricional | 60% | Nutri-Score clásico (`nutri-score.ts`) |
| Aditivos | 30% | riesgo por aditivo E (`additives.ts`) |
| Procesamiento | 10% | grupo NOVA |

**Regla peruana:** cualquier octógono limita la nota a ≤ 50; las grasas trans, a ≤ 25.
Así un producto "alto en azúcar" **nunca** sale como excelente.

### Octógonos (Ley 30021, Fase 2 — vigente desde set. 2021)

| Nutriente | Sólidos /100 g | Líquidos /100 ml |
|---|---|---|
| Azúcar total | ≥ 10 g | ≥ 5 g |
| Sodio | ≥ 400 mg | ≥ 100 mg |
| Grasas saturadas | ≥ 4 g | ≥ 3 g |
| Grasas trans | contiene → advertir | contiene → advertir |

Definidos en `src/lib/octogonos.ts`. Sumi los **calcula** desde los nutrientes,
sin depender de que la marca los declare.

---

## Importación masiva desde Open Food Facts

Para no depender de que cada producto se escanee uno por uno, Sumi siembra su
base con el catálogo peruano de OFF (filtrado por país, `countries_tags_en=peru`).
Es 100% fuente abierta (licencia ODbL) y al ingerir ya calcula Sumi-Score y
octógonos con el mismo motor de la app.

- **Lógica:** `src/lib/off-import.ts` (recorre OFF paginado y hace *upsert*
  idempotente por `barcode` — re-ejecutar actualiza, no duplica).
- **Mantenimiento automático:** endpoint `GET /api/cron/import-off`, disparado
  por **Vercel Cron** cada lunes (ver `vercel.json`). Protegido con `CRON_SECRET`.
  Acepta `?pages=`, `?start=` y `?size=` para acotar/continuar corridas grandes.
- **Corrida manual:** `npm run import:off` (`PAGES=20 START=21 npm run import:off`
  para limitar/continuar). Lee credenciales de `.env.local`.

> Calidad de datos: solo se asigna nota a alimentos/bebidas **con** datos
> nutricionales; el resto queda *pendiente de datos* (sin nota inventada).
> Sin scraping de retailers, el catálogo abierto trae menos precios e imágenes
> — a cambio de **cero riesgo legal**.

---

## Stack

- **Next.js 15** (App Router) como **PWA** instalable — sin app store.
- **ZXing** para escanear el código de barras con la cámara del navegador.
- **Supabase** (Postgres + Storage + Auth) — base propia, fotos y usuarios. *(V1)*
- **Claude (visión)** — OCR de tablas nutricionales. *(V1)*
- **Vercel** — hosting.

## Estructura

```
src/
├── app/
│   ├── page.tsx                     # escáner + resultado (orquestador)
│   ├── layout.tsx
│   └── api/producto/[barcode]/      # resuelve y evalúa un producto
├── components/
│   ├── BarcodeScanner.tsx           # cámara (ZXing) + entrada manual
│   ├── ScoreBadge.tsx               # la nota Sumi
│   ├── OctagonWarnings.tsx          # octógonos al estilo oficial
│   └── ProductResult.tsx            # ficha completa del producto
└── lib/
    ├── octogonos.ts                 # umbrales legales peruanos  (+ test)
    ├── nutri-score.ts               # Nutri-Score clásico
    ├── additives.ts                 # riesgo de aditivos
    ├── sumi-score.ts                # motor principal           (+ test)
    └── openfoodfacts.ts             # cliente OFF
```

## Desarrollo

```bash
npm install
cp .env.example .env.local   # configura OFF_USER_AGENT
npm run dev                  # http://localhost:3000
npm test                     # pruebas del motor
npm run build                # build de producción
```

> Nota: Open Food Facts puede estar bloqueado en entornos con allowlist de red.
> En local/producción funciona configurando `OFF_USER_AGENT`.

## Roadmap

- [x] **MVP** — escanear → OFF → Sumi-Score + octógonos (sin login)
- [ ] **V1** — base propia en Supabase + flujo foto + IA para productos faltantes
- [ ] **V2** — motor de **alternativas** ("mejor que esto") + cuentas, favoritos, historial
- [ ] **V3** — precios reales de retailers, **cosméticos** (como Yuka), modo offline

## Aviso

Sumi es una herramienta informativa y educativa. No reemplaza el consejo de un
profesional de la salud o nutrición.
