# قالب فایل‌ها و داده‌ها

[English](FILE_FORMAT.md)

همه‌ی قالب‌ها JSON ساده یا متن نشانی‌اند. تنها خروجی‌های PDF و PNG دودویی هستند.

## ۱. فایل پروژه (`.gncad`)

```
{
  "canvasData": { ... },
  "meta": {
    "customLayers": [{ "id": "...", "name": "..." }],
    "activeFloorId": "floor-1",
    "floors": [
      { "id": "floor-1", "name": "Floor 1", "json": null, "graph": { ... } },
      { "id": "floor-2", "name": "Floor 2", "json": { ... }, "graph": { ... } }
    ]
  }
}
```

- `canvasData` همان JSON نسخه‌ی ۵٫۵ Fabric.js برای **طبقه‌ی فعال** است، با `data` و `name` هر شیء. نسخه‌های بدون پشتیبانی طبقه فایل را باز می‌کنند و طبقه‌ی فعال را می‌بینند.
- برای طبقه‌ی فعال `meta.floors[i].json` برابر `null` است؛ طبقه‌های دیگر JSON Fabric خودشان را دارند.
- `meta` ممکن است نباشد (فایل‌های پیش از طبقه‌ها) و `graph` ممکن است `null` باشد؛ هر دو به‌صورت یک طبقه بدون گراف بارگذاری می‌شوند.
- طول‌ها پیکسل بوم‌اند. **۴۰ پیکسل = ۱ متر.** Y به پایین رشد می‌کند.

### قراردادهای شیء

| `data.type` | نوع Fabric | داده‌ی اضافه |
|---|---|---|
| `wall-system` | `polyline` | `layer`؛ `strokeWidth` = ضخامت خط (۲ نازک، ۵ متوسط، ۱۰ ضخیم)؛ اختیاری `filletUndo` |
| `room` | `group` یا `polygon` | `baseColor`، `hatchPattern` (`solid`، `diagonal`، `cross`، `dots`، `grid`، `wood`، `checker`، `brick`، `concrete`)؛ اتاق‌های چندضلعی گراف `graphKey` و `holes` دارند |
| `door`، `window` | `group` | `width` بر حسب پیکسل |
| `stairs` | `group` | |
| `furniture` | `image`، `group` یا `path` | `name` |
| `user-group` | `group` | |

نقاط پلی‌لاین در فضای محلی شیء‌اند. موقعیت مطلق `transform(point - pathOffset, calcTransformMatrix())` است.

### گراف دیوار (`meta.floors[i].graph`)

```
{
  "version": 1,
  "authoritative": true,
  "nodes": [{ "x": 120, "y": 80 }],
  "edges": [{ "a": 0, "b": 1, "t": 5, "l": "walls" }]
}
```

`a` و `b` اندیس گره‌ها، `t` ضخامت به پیکسل و `l` نام لایه است. اگر `authoritative` درست باشد، هنگام بازکردن فایل دیوارها از روی گراف بازسازی می‌شوند. گراف نامعتبر (اندیس بد، مقدار غیرعددی، ضخامت غیرمثبت) نادیده گرفته و از دیوارهای بوم استفاده می‌شود.

## ۲. پیوند اشتراک

`<نشانی صفحه>#p=<کد>`

`code` با یک حرف نوع شروع می‌شود: `g` برای gzip و سپس base64url، `r` برای UTF-8 خام و سپس base64url (وقتی `CompressionStream` نیست). محتوا همان JSON فایل پروژه است. پیوند فقط پس از تأیید کاربر باز می‌شود.

## ۳. خروجی تنظیمات

یک شیء JSON تخت با کلیدهای `DEFAULT_SETTINGS` (`js/settings.js`)، مثلاً:

```
{ "theme": "dark", "language": "en", "units": "metric", "wallThickness": 5, "autosave": 0 }
```

کلیدهای ناشناخته حذف می‌شوند و مقدارهای نامعتبر هنگام درون‌ریزی به پیش‌فرض برمی‌گردند.

## ۴. کلیدهای ذخیره‌سازی مرورگر

| کلید | محتوا |
|---|---|
| `naqshcad-settings` | شیء تنظیمات |
| `naqshcad-autosave` | `{ time, dirty, payload }` که `payload` شکل پروژه‌ی بالا را دارد |
| `naqshcad-custom-symbols` | آرایه‌ی `{ id, name, sizeMeters, svg }` (متن SVG پاک‌سازی‌شده)، تا ۴۰ |

## ۵. جدول متراژ CSV

سرستون: `Floor,Category,Item,Quantity,Length_m,Area_m2`. UTF-8 با نشانه‌ی ترتیب بایت. دسته‌ها: `Room`، `Walls`، `Doors`، `Windows`، `Stairs`، `Furniture`. همیشه متریک، فارغ از تنظیم واحد. برای ردیف اتاق `Length_m` محیط است.

## ۶. خروجی DXF

DXF اسکی به سبک AutoCAD R12 (`$ACADVER AC1009`). موجودیت LINE برای دیوار و خط اندازه، LWPOLYLINE برای اتاق و جعبه‌ی محیطی در، پنجره، پله و مبلمان. در خروجی همه‌ی طبقه‌ها برای هر طبقه یک LAYER (`FLOOR_<n>_<نام ascii>`) و در خروجی تک‌طبقه `0`. واحدها پیکسل برنامه‌اند (۴۰ در هر متر) و Y منفی می‌شود.

## ۷. قواعد سازگاری

۱. داده‌ی جدید کنار داده‌ی موجود می‌آید، نه به‌جای آن.
۲. خواننده‌ها باید کلیدهای ناشناخته را نادیده بگیرند.
۳. فایلی که نسخه‌ی جدیدتر ذخیره کرده باید در نسخه‌ی قدیمی‌تر باز شود، حداکثر با از دست رفتن همان قابلیت جدید.
