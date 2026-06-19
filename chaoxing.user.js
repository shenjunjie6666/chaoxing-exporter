// ==UserScript==
// @name         学习通提取助手
// @namespace    http://tampermonkey.net/
// @version      3.2
// @description  一键提取学习通练习题，支持多格式导出（含Word）。修复了悬浮窗消失的问题。
// @match        *://*.chaoxing.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let panelCreated = false;

    // --- 1. 智能检测：每隔 1 秒检测一次页面，发现题目才生成面板 ---
    const checkTimer = setInterval(() => {
        if (document.querySelectorAll('div.questionLi').length > 0 && document.body) {
            if (!panelCreated) {
                initPanel();
                panelCreated = true;
            }
            clearInterval(checkTimer);
        }
    }, 1000);

    // --- 2. 创建界面的主函数 ---
    function initPanel() {
        const panel = document.createElement('div');
        panel.style.position = 'fixed';
        panel.style.bottom = '50px';
        panel.style.right = '50px';
        panel.style.padding = '15px';
        panel.style.backgroundColor = '#ffffff';
        panel.style.border = '1px solid #e0e0e0';
        panel.style.borderRadius = '10px';
        panel.style.zIndex = '2147483647';
        panel.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        panel.style.display = 'flex';
        panel.style.flexDirection = 'column';
        panel.style.gap = '10px';
        panel.style.maxWidth = '200px';

        const title = document.createElement('div');
        title.innerText = '📚 提取助手 v3.2';
        title.style.fontWeight = 'bold';
        title.style.textAlign = 'center';
        title.style.color = '#333';
        title.style.marginBottom = '5px';
        panel.appendChild(title);

        const copyBtn = createButton('📋 复制纯文本', '#FF9800');
        const downloadTxtBtn = createButton('💾 导出为 TXT', '#4CAF50');
        const downloadMdBtn = createButton('📝 导出为 Markdown', '#00BCD4');
        const downloadWordBtn = createButton('📄 导出为 Word', '#9C27B0');

        panel.appendChild(copyBtn);
        panel.appendChild(downloadTxtBtn);
        panel.appendChild(downloadMdBtn);
        panel.appendChild(downloadWordBtn);
        document.body.appendChild(panel);

        // --- 绑定事件 ---
        copyBtn.onclick = async function() {
            const text = extractContent('txt');
            if (!text) return;
            try {
                await navigator.clipboard.writeText(text);
                showFeedback(copyBtn, '✅ 复制成功', '#FF9800');
            } catch (err) {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                showFeedback(copyBtn, '✅ 复制成功', '#FF9800');
            }
        };

        downloadTxtBtn.onclick = function() {
            const text = extractContent('txt');
            if (!text) return;
            downloadFile(text, 'txt', 'text/plain');
            showFeedback(downloadTxtBtn, '✅ 导出成功', '#4CAF50');
        };

        downloadMdBtn.onclick = function() {
            const text = extractContent('md');
            if (!text) return;
            downloadFile(text, 'md', 'text/markdown');
            showFeedback(downloadMdBtn, '✅ 导出成功', '#00BCD4');
        };

        downloadWordBtn.onclick = function() {
            const html = generateWordHTML();
            if (!html) return;
            downloadFile(html, 'doc', 'application/msword');
            showFeedback(downloadWordBtn, '✅ 导出成功', '#9C27B0');
        };
    }

    // --- 辅助函数：创建按钮 ---
    function createButton(text, bgColor) {
        const btn = document.createElement('button');
        btn.innerText = text;
        btn.style.padding = '8px 12px';
        btn.style.backgroundColor = bgColor;
        btn.style.color = 'white';
        btn.style.border = 'none';
        btn.style.borderRadius = '6px';
        btn.style.fontSize = '14px';
        btn.style.cursor = 'pointer';
        btn.style.transition = 'opacity 0.2s';
        btn.onmouseover = () => btn.style.opacity = '0.8';
        btn.onmouseout = () => btn.style.opacity = '1';
        return btn;
    }

    // --- 提取内容（支持 txt 和 md）---
    function extractContent(type = 'txt') {
        let resultText = "";
        let questions = document.querySelectorAll('div.questionLi');

        if (questions.length === 0) {
            alert("⚠️ 未提取到内容，页面可能正在加载，请稍后再试！");
            return null;
        }

        if (type === 'md') {
            resultText += "# 学习通练习题提取\n\n";
        } else {
            resultText += "=== 学习通练习题提取 ===\n\n";
        }

        questions.forEach((q, index) => {
            let titleEl = q.querySelector('h3.mark_name') || q.querySelector('.mark_name');
            let titleText = titleEl ? titleEl.innerText.replace(/\s+/g, ' ').trim() : "[未找到题目正文]";

            if (type === 'md') {
                resultText += `### ${index + 1}. ${titleText}\n\n`;
            } else {
                resultText += `${index + 1}. ${titleText}\n`;
            }

            let options = q.querySelectorAll('ul.mark_letter li');
            options.forEach(opt => {
                let optText = opt.innerText.replace(/\s+/g, ' ').trim();
                if (type === 'md') {
                    resultText += `- ${optText}\n`;
                } else {
                    resultText += optText + "\n";
                }
            });
            if (type === 'md' && options.length > 0) resultText += "\n";

            let answerEl = q.querySelector('.mark_answer') || q.querySelector('.colorGreen') || q.querySelector('.answerBg');
            if (answerEl) {
                let answerText = answerEl.innerText.replace(/\s+/g, ' ').trim();
                if (type === 'md') {
                    resultText += `> **正确答案**: ${answerText}\n`;
                } else {
                    resultText += `【正确答案】: ${answerText}\n`;
                }
            }

            let analysisEl = q.querySelector('.mark_strategy') || q.querySelector('.analysis');
            if (analysisEl) {
                let analysisText = analysisEl.innerText.replace(/\s+/g, ' ').trim();
                if (type === 'md') {
                    resultText += `> **答案解析**: ${analysisText}\n`;
                } else {
                    resultText += `【答案解析】: ${analysisText}\n`;
                }
            }

            if (type === 'md') {
                resultText += "\n---\n\n";
            } else {
                resultText += "\n------------------------\n\n";
            }
        });

        return resultText;
    }

    // --- 生成 Word 文档的 HTML 内容（带样式）---
    function generateWordHTML() {
        let questions = document.querySelectorAll('div.questionLi');
        if (questions.length === 0) {
            alert("⚠️ 未提取到内容，页面可能正在加载，请稍后再试！");
            return null;
        }

        // 构建 HTML 片段
        let bodyHtml = `<h1 style="text-align:center;font-size:24pt;color:#333;">学习通练习题提取</h1><hr style="border:1px solid #ccc;">`;

        questions.forEach((q, index) => {
            let titleEl = q.querySelector('h3.mark_name') || q.querySelector('.mark_name');
            let titleText = titleEl ? titleEl.innerText.replace(/\s+/g, ' ').trim() : "[未找到题目正文]";

            // 题目（大号、加粗）
            bodyHtml += `<h3 style="font-size:16pt;font-weight:bold;color:#1a1a1a;margin-top:20px;margin-bottom:8px;">${index + 1}. ${titleText}</h3>`;

            // 选项（有序列表，字母序号）
            let options = q.querySelectorAll('ul.mark_letter li');
            if (options.length > 0) {
                bodyHtml += `<ul style="list-style-type:lower-alpha;padding-left:25px;font-size:12pt;margin-top:4px;margin-bottom:8px;">`;
                options.forEach(opt => {
                    let optText = opt.innerText.replace(/\s+/g, ' ').trim();
                    bodyHtml += `<li style="margin-bottom:2px;">${optText}</li>`;
                });
                bodyHtml += `</ul>`;
            }

            // 正确答案（红色加粗）
            let answerEl = q.querySelector('.mark_answer') || q.querySelector('.colorGreen') || q.querySelector('.answerBg');
            if (answerEl) {
                let answerText = answerEl.innerText.replace(/\s+/g, ' ').trim();
                bodyHtml += `<p style="color:#d32f2f;font-weight:bold;font-size:12pt;margin:4px 0;">✅ 正确答案：${answerText}</p>`;
            }

            // 答案解析（灰色斜体）
            let analysisEl = q.querySelector('.mark_strategy') || q.querySelector('.analysis');
            if (analysisEl) {
                let analysisText = analysisEl.innerText.replace(/\s+/g, ' ').trim();
                bodyHtml += `<p style="color:#555;font-style:italic;font-size:11pt;margin:4px 0 12px 0;">📖 解析：${analysisText}</p>`;
            }

            // 分割线
            bodyHtml += `<hr style="border:0;border-top:1px dashed #aaa;margin:16px 0;">`;
        });

        // 完整 HTML 文档
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>学习通练习题</title>
    <style>
        body { font-family: '宋体', SimSun, serif; padding: 20px; background: #fafafa; }
        .container { max-width: 800px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        h1 { text-align: center; color: #333; }
        hr { border: 0; border-top: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="container">
        ${bodyHtml}
    </div>
</body>
</html>`;
    }

    // --- 下载文件 ---
    function downloadFile(content, ext, mimeType) {
        const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().slice(0,10).replace(/-/g,"");
        a.download = `学习通题目_${timestamp}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // --- 按钮反馈 ---
    function showFeedback(btn, msg, originalColor) {
        const originalText = btn.innerText;
        btn.innerText = msg;
        btn.style.backgroundColor = '#2196F3';
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.backgroundColor = originalColor;
        }, 2000);
    }
})();
