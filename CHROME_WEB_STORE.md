# Nimbus Markdown — Chrome Web Store

ข้อความภาษาอังกฤษด้านล่างเตรียมไว้สำหรับคัดลอกลงแบบฟอร์ม โดยอ้างอิง README และ manifest เวอร์ชัน 6.0 ของโปรเจกต์ ไม่ได้อ่านฟอร์มจริงใน Developer Console จึงอาจมีชื่อช่องต่างกัน

## ลำดับกรอก Privacy ตามฟอร์มจริง

### 1. Single purpose description

Render local and user-authorized remote Markdown documents in the browser, with configurable themes, syntax highlighting, diagrams, math formulas, and document navigation.

### 2. storage justification

Required to save rendering preferences, themes, Markdown options, and user-configured site rules using Chrome storage. Preferences are synchronized through chrome.storage.sync. Document scroll positions are saved in chrome.storage.local so users can resume reading.

### 3. scripting justification

Required to detect Markdown documents and inject the packaged renderer, styles, and enabled rendering features into local files and websites for which the user has granted access.

### 4. webRequest justification

Used by the automatic reload feature to observe completed document requests and their connection IP information on authorized sites. This helps the extension distinguish local development previews from remote documents and adjust reload behavior. The permission can be removed when automatic reload is disabled.

### 5. Are you using remote code?

เลือก **No, I am not using Remote code** หากแพ็กเกจที่อัปโหลดใช้ JavaScript/Wasm ที่รวมอยู่ในแพ็กเกจทั้งหมด จาก entry point ที่ตรวจพบมีการโหลดสคริปต์ภายในแพ็กเกจ แต่ยังไม่ได้ตรวจแพ็กเกจ ZIP ทั้งหมด

**Justification:** เว้นว่างหากเลือก No และฟอร์มไม่บังคับ ภาพ emoji ที่โหลดจาก CDN ไม่ใช่ remote executable code

### 6. Data usage

แนวทางด้านล่างอ้างอิงพฤติกรรมใน source ที่ตรวจ ไม่ใช่การรับรองแพ็กเกจที่อัปโหลด การประมวลผลหรือเก็บข้อมูลเฉพาะในเครื่องก็ต้องอธิบายใน privacy policy

| ตัวเลือกในฟอร์ม | แนวทาง | เหตุผล |
| --- | --- | --- |
| Personally identifiable information | ไม่เลือก หากไม่มีฟีเจอร์อื่นเก็บข้อมูลนี้ | ไม่พบฟีเจอร์เก็บข้อมูลระบุตัวตนโดยเฉพาะ |
| Health information | ไม่เลือก หากไม่มีฟีเจอร์อื่นเก็บข้อมูลนี้ | ไม่พบฟีเจอร์ด้านสุขภาพ |
| Financial and payment information | ไม่เลือก หากไม่มีฟีเจอร์อื่นเก็บข้อมูลนี้ | ไม่พบระบบชำระเงิน |
| Authentication information | ไม่เลือก หากไม่มีฟีเจอร์อื่นเก็บข้อมูลนี้ | ไม่พบระบบล็อกอินหรือเก็บรหัสผ่าน |
| Personal communications | ไม่เลือก หากไม่มีฟีเจอร์อื่นเก็บข้อมูลนี้ | ไม่พบฟีเจอร์เข้าถึงอีเมลหรือแชตโดยเฉพาะ |
| Location | ควรเปิดเผยการประมวลผล IP ให้ชัดเจน | webRequest อ่าน IP ปลายทางของคำขอเพื่อแยก localhost ไม่ใช่ GPS หรือการหาตำแหน่งผู้ใช้; ตรวจคำอธิบายในฟอร์มก่อนตัดสินใจเลือกหมวดนี้ |
| Web history | ควรเลือก | ตรวจ URL และใช้ URL ผูกกับตำแหน่งการอ่าน แม้ไม่ได้เก็บประวัติการท่องเว็บทั้งหมด |
| User activity | ควรเลือก | เก็บตำแหน่ง scroll และสังเกต completed requests สำหรับ autoreload |
| Website content | ควรเลือก | อ่านและแปลงเนื้อหา Markdown เพื่อแสดงผล |

### 7. Certifications

ตรวจและติ๊กทั้ง 3 ข้อด้วยเจ้าของบัญชีเมื่อยืนยันว่าตรงกับพฤติกรรมจริงและ privacy policy:

- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

### 8. Privacy policy URL

สร้างนโยบายไว้ใน `PRIVACY.md` แล้ว เมื่อ commit และ push ไฟล์ไปยัง branch `main` ของ repository สาธารณะ ให้ใช้ URL นี้:

```text
https://github.com/dvgamerr-app/nimbus-markdown/blob/main/PRIVACY.md
```

URL นี้เป็นปลายทางที่คาดไว้ ยังไม่ได้เผยแพร่หรือยืนยันว่าเปิดได้ในงานนี้ ต้องเปิดตรวจหลัง push ก่อนนำไปกรอก

นโยบายควรอธิบายเนื้อหาและ URL ที่ประมวลผล, scroll position ที่เก็บในเครื่อง, Chrome Sync, IP ปลายทางที่ใช้ใน autoreload และคำขอภาพ emoji ไปยัง CDN ให้ตรงกับการทำงานจริง

อ้างอิง: https://developer.chrome.com/docs/webstore/program-policies/user-data-faq

## ลำดับกรอก Distribution ตามฟอร์มจริง

### 1. Payments

เลือก **Free of charge** — README ระบุว่าใช้ฟรี และไม่พบฟีเจอร์ซื้อสินค้า ฟีเจอร์เพิ่ม หรือ subscription ในข้อมูลที่ตรวจ

### 2. Visibility

เลือกตามกลุ่มผู้ใช้ที่ต้องการ:

- **Public:** สำหรับเผยแพร่ให้ผู้ใช้ทั่วไปค้นหาและติดตั้ง
- **Unlisted:** สำหรับแจกผ่านลิงก์
- **Private:** สำหรับ trusted testers เท่านั้น

ถ้าตั้งใจเปิดตัวสาธารณะ ให้เลือก **Public**

### 3. Distribution

เลือก **All regions** หากต้องการให้ติดตั้งได้ทุกภูมิภาค ไม่มีข้อจำกัดภูมิภาคที่พบในโปรเจกต์

### 4. Credentials — Username

เว้นว่าง — ส่วนขยายไม่ต้องล็อกอิน

### 5. Credentials — Password

เว้นว่าง — ไม่ต้องใช้บัญชีทดสอบ

### 6. Additional instructions

ข้อความนี้สั้นกว่า 500 ตัวอักษรเพื่อรองรับข้อจำกัดที่แสดงในฟอร์ม:

```text
No login required. In chrome://extensions, open Nimbus Markdown > Details and enable "Allow access to file URLs". Open a local .md file to view rendered Markdown. Use the popup or Advanced Options to change themes and enable Mermaid, MathJax, syntax highlighting, and ToC. Edit and save the file to test autoreload. For remote Markdown, add its origin in Advanced Options, grant site access, then open the raw Markdown URL.
```

## ลำดับกรอก Store listing ตามฟอร์มจริง

แท็บ Store listing ใน Developer Dashboard แบ่งเป็น 3 ส่วน: Product details, Graphic assets และ Additional fields

### Product details

#### Title from package

```text
Nimbus Markdown
```

อ่านจาก `name` ใน manifest แก้ในฟอร์มไม่ได้

#### Summary from package

```text
Read Markdown in Chrome with Mermaid diagrams you can explore in fullscreen, DBML schemas, math, code highlighting and 30+ themes.
```

อ่านจาก `description` ใน `manifest.chrome.json` (130 ตัวอักษร ไม่เกิน 132) แก้ในฟอร์มไม่ได้ จะเปลี่ยนเมื่ออัปโหลดแพ็กเกจเวอร์ชันถัดไป

#### Description

```text
Nimbus Markdown turns Markdown files into clean, themed documents right in your browser, and makes their Mermaid diagrams something you can explore instead of just look at.

EXPLORE DIAGRAMS IN FULLSCREEN

• Open any Mermaid diagram fullscreen, then zoom and move around it.
• Find a node by name (/) and open an overview map of the whole diagram (M).
• Hover a node to light its links: blue into it, orange out of it. Click it to see its connections, upstream and downstream.
• Play sequence, state, journey and timeline diagrams step by step (P).
• Journey maps, timelines, gantt, pie, quadrant, git graph, C4, mindmap and requirement diagrams are redrawn in one calm, editorial style.
• DBML code blocks become database schemas with key chips and routed foreign keys.

A COMPLETE MARKDOWN READER

• Over 30 themes, light and dark, plus your own CSS.
• GitHub Flavored Markdown: tables, task lists, footnotes, strikethrough and emoji.
• Syntax highlighting for code blocks, and a highlighted raw Markdown view.
• MathJax formulas.
• A table of contents that follows where you are reading.
• Automatic reload when you save a local file.
• Remembered scroll positions and settings that sync through your browser.

BUILT FOR THE DOCS DEVELOPERS READ EVERY DAY

README files, design notes, architecture docs and the Markdown your AI coding agent writes. Open them straight from disk without switching to an editor.

GET STARTED

1. Open chrome://extensions, click Details on Nimbus Markdown and turn on "Allow access to file URLs".
2. Drag a .md file into the browser.
3. For Markdown on websites, open Advanced Options and add the sites you want. Nothing runs on a site until you allow it.

PRIVACY

Rendering happens in your browser. Your documents are not uploaded to a developer server. Read the privacy policy for the full details.

FREE AND OPEN SOURCE

MIT licensed. Nimbus Markdown is a maintained fork of Markdown Viewer by Simeon Velichkov, with diagrams styled after the diagram-design project by Cathryn Lavery.

Source code, examples and issues:
https://github.com/dvgamerr-app/nimbus-markdown
```

#### Category

**Developer Tools** (อยู่ในกลุ่ม Productivity)

#### Language

**English**

### Graphic assets

ไฟล์ทั้งหมดอยู่ใน `docs/store/` เป็น PNG 24-bit RGB ไม่มี alpha ภาพหน้าจอเป็นการ render เอกสาร mock ใน `docs/showcase/` ผ่าน extension จริง ดีไซน์อยู่ใน `docs/store/assets.html` (โทน editorial ตาม diagram-design) สร้างใหม่ได้ด้วย `bun run build:store`

| ช่อง | ไฟล์ | ขนาด | ข้อความหลัก |
| --- | --- | --- | --- |
| Store icon | `docs/store/store-icon-128.png` | 128×128 | — |
| Global promo video | เว้นว่าง หากยังไม่มีวิดีโอ YouTube | — | — |
| Screenshot 1 | `docs/store/screenshot-01-flowchart.png` | 1280×800 | Mermaid diagrams you can explore. |
| Screenshot 2 | `docs/store/screenshot-02-sequence.png` | 1280×800 | Sequence diagrams, day or night. |
| Screenshot 3 | `docs/store/screenshot-03-journey.png` | 1280×800 | Journeys and timelines that play. |
| Screenshot 4 | `docs/store/screenshot-04-dbml.png` | 1280×800 | Database schemas, drawn for you. |
| Screenshot 5 | `docs/store/screenshot-05-document.png` | 1280×800 | Markdown, beautifully rendered. |
| Small promo tile | `docs/store/small-promo-440x280.png` | 440×280 | Nimbus Markdown |
| Marquee promo tile | `docs/store/marquee-promo-1400x560.png` | 1400×560 | Markdown, beautifully rendered. |

ถ้าจะทำ Global promo video ใช้ GIF ใน `docs/screenshots/fullscreen-*.gif` เป็นต้นทาง แล้วอัปโหลดขึ้น YouTube ก่อนนำ URL มากรอก

### Additional fields

| ช่อง | ค่า |
| --- | --- |
| Official URL | **None** จนกว่าจะยืนยันเจ้าของโดเมน `dvgamerr.app` ใน Google Search Console แล้วค่อยเลือก |
| Homepage URL | `https://dvgamerr.app/nimbus-markdown/` (หลัง Pages deploy แล้ว ระหว่างนี้ใช้ `https://github.com/dvgamerr-app/nimbus-markdown`) |
| Support URL | `https://github.com/dvgamerr-app/nimbus-markdown/issues` |
| Mature content | **ไม่เลือก** ไม่มีเนื้อหาสำหรับผู้ใหญ่ |

## Privacy practices — Single purpose

### Single purpose description

Render local and user-authorized remote Markdown documents in the browser, with configurable themes, syntax highlighting, diagrams, math formulas, and document navigation.

## Permission justifications

### storage

Required to save rendering preferences, themes, Markdown options, and user-configured site rules using Chrome storage. Preferences are synchronized through chrome.storage.sync. Document scroll positions are saved in chrome.storage.local so users can resume reading.

### scripting

Required to detect Markdown documents and inject the packaged renderer, styles, and enabled rendering features into local files and websites for which the user has granted access.

### Host permission: file:///*

Required to read and render local Markdown files and refresh their previews when files change. Users must enable “Allow access to file URLs” in Chrome's extension settings before local file access is available.

### Optional host permissions: *://*/

Allows users to enable Markdown rendering on HTTP and HTTPS websites of their choice. Markdown files may be hosted on arbitrary domains, so the extension requests access to sites selected by the user rather than requiring access to every website at installation. Authorized access is used to detect and render Markdown documents and support reload behavior.

### Optional permission: webRequest

Used by the automatic reload feature to observe completed document requests and their connection IP information on authorized sites. This helps the extension distinguish local development previews from remote documents and adjust reload behavior. The permission can be removed when automatic reload is disabled.

## Reviewer test instructions

No account or login is required to test the extension.

1. Install Nimbus Markdown.
2. Open chrome://extensions, find Nimbus Markdown, open Details, and enable “Allow access to file URLs”.
3. Create a local .md file containing headings, a table, a task list, and a fenced code block. Open it in Chrome and confirm it renders.
4. Open the extension popup or Advanced Options to change themes and rendering options.
5. Add a Mermaid fenced code block and a MathJax formula to the document. Enable the corresponding features and confirm they render.
6. With automatic reload enabled, edit and save the local file and confirm the preview updates.
7. To test remote documents, add the document's origin in Advanced Options, grant the requested site permission, and open a raw Markdown URL on that origin.

## ข้อมูลที่ต้องเติมหรือตรวจสอบก่อนส่ง

- **Privacy policy URL:** มีไฟล์ `PRIVACY.md` แล้ว ต้องเผยแพร่บน GitHub และตรวจว่าเปิดอ่านแบบสาธารณะได้ก่อนกรอก URL
- **Contact email:** ใช้อีเมลสำหรับติดต่อผู้ดูแลจริง ไม่ใช่อีเมลผู้เขียนต้นฉบับใน LICENSE
- **Screenshots / promotional images:** ภาพใน `docs/store/` ถ่ายจาก build ปัจจุบัน ถ้า UI ของ diagram เปลี่ยนให้ถ่ายใหม่ก่อนส่ง
- **Data usage declarations:** ตรวจตามพฤติกรรมจริงก่อนเลือกคำตอบ การเรนเดอร์เข้าถึงเนื้อหาเอกสารและ URL; ตำแหน่งการอ่านถูกเก็บใน local storage และการตั้งค่ารวมถึง site rules ใช้ Chrome Sync
- **External requests:** ตัวแปลง emoji ใช้ภาพจาก cdn.jsdelivr.net และเอกสารที่เรนเดอร์อาจอ้างอิงทรัพยากรภายนอก จึงไม่ควรระบุว่าการทำงานทั้งหมดเป็น offline หรือไม่มีการเชื่อมต่อภายนอก
- **Remote code declaration:** การโหลดภาพจาก CDN ไม่ใช่หลักฐานว่ามี remote executable code ต้องตรวจ renderer, vendor scripts และแพ็กเกจที่จะส่งก่อนตอบช่องนี้
- **Certifications / agreements:** เจ้าของบัญชีควรตรวจข้อความรับรองและข้อตกลงในฟอร์มจริงก่อนยืนยัน

## Source references

- `README.md`, `docs/reference.md` — ฟีเจอร์และขั้นตอนใช้งาน
- `manifest.json`, `manifest.chrome.json` — ชื่อ เวอร์ชัน และสิทธิ์
- `background/storage.js` — การเก็บและซิงก์การตั้งค่า
- `background/detect.js`, `background/inject.js` — ตรวจจับและเรนเดอร์เอกสาร
- `background/webrequest.js` — การใช้ optional webRequest
- `background/xhr.js` — การอ่านเอกสาร
- `content/scroll.js` — การจำตำแหน่งการอ่าน
- `content/emoji.js` — ภาพ emoji จาก CDN
