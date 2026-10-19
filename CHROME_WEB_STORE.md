# Nimbus Markdown — Chrome Web Store

ข้อความภาษาอังกฤษด้านล่างเตรียมไว้สำหรับคัดลอกลงแบบฟอร์ม โดยอ้างอิง README และ manifest เวอร์ชัน 5.3 ของโปรเจกต์ ไม่ได้อ่านฟอร์มจริงใน Developer Console จึงอาจมีชื่อช่องต่างกัน

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

## Graphic assets — ไฟล์พร้อมอัปโหลด

ไฟล์อยู่ในโฟลเดอร์ `store-assets/` เป็น PNG 24-bit RGB ไม่มี alpha ทั้งหมด ใช้โลโก้และภาพ UI ที่มีอยู่จริงในโปรเจกต์

| ช่อง | ไฟล์ | ขนาด |
| --- | --- | --- |
| Store icon | `store-assets/store-icon-128.png` | 128×128 |
| Global promo video | เว้นว่าง หากยังไม่มีวิดีโอ YouTube | — |
| Screenshots ลำดับ 1 | `store-assets/screenshot-01-settings.png` | 1280×800 |
| Screenshots ลำดับ 2 | `store-assets/screenshot-02-dark-mode.png` | 1280×800 |
| Screenshots ลำดับ 3 | `store-assets/screenshot-03-quick-controls.png` | 1280×800 |
| Small promo tile | `store-assets/small-promo-440x280.png` | 440×280 |
| Marquee promo tile | `store-assets/marquee-promo-1400x560.png` | 1400×560 |

ภาพหน้าจอชุดนี้แสดงหน้าตั้งค่าและ popup พร้อมข้อความประกอบ ไม่ใช่ภาพเอกสาร Markdown ที่เรนเดอร์ สร้างซ้ำได้ด้วย `./store-assets.ps1`

## Store listing

### Name

Nimbus Markdown

### Short description

Render Markdown with dark mode, themes, Mermaid diagrams, math formulas, syntax highlighting, and automatic reload.

### Detailed description

Nimbus Markdown turns Markdown files into readable, themed documents directly in your browser. Preview local files and Markdown URLs on websites you choose to enable.

FEATURES

• Light and dark themes, with over 30 themes and custom theme support.
• GitHub Flavored Markdown, including tables, task lists, and strikethrough.
• Syntax highlighting for fenced code blocks.
• Mermaid diagrams and MathJax formulas.
• A table of contents for navigating long documents.
• Automatic reload for local files and local development previews.
• Raw and rendered Markdown views.
• Remembered scroll positions.
• Configurable Markdown detection by file path and content type.
• Settings synchronization through your browser.

GET STARTED

For local files, open the extension's Details page at chrome://extensions and enable “Allow access to file URLs”. Then open a Markdown file in your browser.

For remote files, open Nimbus Markdown's Advanced Options and add the websites you want to enable. Site access can be managed individually.

CUSTOMIZE YOUR READING EXPERIENCE

Choose a theme, adjust content width, configure Markdown options, and enable the rendering features you need. You can also upload a custom CSS theme.

Nimbus Markdown is free and open source. It is a fork of Markdown Viewer by Simeon Velichkov.

Source code and documentation:
https://github.com/dvgamerr-app/nimbus-markdown

### Language

English — สำหรับ listing ภาษาอังกฤษนี้

### Category

เลือกหมวดที่เกี่ยวกับ Developer Tools หากมีในฟอร์มจริง

### Homepage URL

https://github.com/dvgamerr-app/nimbus-markdown

### Support URL

https://github.com/dvgamerr-app/nimbus-markdown/issues

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
- **Screenshots / promotional images:** เลือกภาพที่ตรงกับหน้าตาและฟีเจอร์ของเวอร์ชันที่อัปโหลด
- **Data usage declarations:** ตรวจตามพฤติกรรมจริงก่อนเลือกคำตอบ การเรนเดอร์เข้าถึงเนื้อหาเอกสารและ URL; ตำแหน่งการอ่านถูกเก็บใน local storage และการตั้งค่ารวมถึง site rules ใช้ Chrome Sync
- **External requests:** ตัวแปลง emoji ใช้ภาพจาก cdn.jsdelivr.net และเอกสารที่เรนเดอร์อาจอ้างอิงทรัพยากรภายนอก จึงไม่ควรระบุว่าการทำงานทั้งหมดเป็น offline หรือไม่มีการเชื่อมต่อภายนอก
- **Remote code declaration:** การโหลดภาพจาก CDN ไม่ใช่หลักฐานว่ามี remote executable code ต้องตรวจ renderer, vendor scripts และแพ็กเกจที่จะส่งก่อนตอบช่องนี้
- **Certifications / agreements:** เจ้าของบัญชีควรตรวจข้อความรับรองและข้อตกลงในฟอร์มจริงก่อนยืนยัน

## Source references

- `README.md` — ฟีเจอร์และขั้นตอนใช้งาน
- `manifest.json`, `manifest.chrome.json` — ชื่อ เวอร์ชัน และสิทธิ์
- `background/storage.js` — การเก็บและซิงก์การตั้งค่า
- `background/detect.js`, `background/inject.js` — ตรวจจับและเรนเดอร์เอกสาร
- `background/webrequest.js` — การใช้ optional webRequest
- `background/xhr.js` — การอ่านเอกสาร
- `content/scroll.js` — การจำตำแหน่งการอ่าน
- `content/emoji.js` — ภาพ emoji จาก CDN
