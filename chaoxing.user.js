// ==UserScript==
// @name         学习通提取助手 (智能版 V3.2)
// @namespace    http://tampermonkey.net/
// @version      3.2
// @description  增加智能雷达按需加载，修复 iframe 重影Bug，保持页面纯净
// @match        *://*.chaoxing.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ================= 0. 智能雷达系统 =================
    // 设置一个巡逻员，每隔 1 秒看一眼页面里有没有题目
    let checkTimer = setInterval(() => {
        let questions = document.querySelectorAll('div.questionLi');
        // 只有真正找到了题目，并且面板还没被创建时，才召唤控制面板
        if (questions.length > 0 && !document.getElementById('chaoxing-magic-panel')) {
            createPanel();
            clearInterval(checkTimer); // 面板出来后，巡逻员就可以下班了
        }
    }, 1000);

    // ================= 1. 打造全新控制面板 =================
    function createPanel() {
        const panel = document.createElement('div');
        panel.id = 'chaoxing-magic-panel'; // 给面板一张专属身份证，防止重复创建
        panel.style.cssText = 'position:fixed; bottom:30px; right:30px; z-index:99999; display:flex; flex-direction:column; gap:10px; background:rgba(255, 255, 255, 0.98); padding:18px; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.15); border:1px solid #e0e0e0; font-family: sans-serif;';
        document.body.appendChild(panel);

        const title = document.createElement('div');
        title.innerHTML = '<b>🚀 提取助手 V3.2</b><br><span style="font-size:12px;color:#666;">By 夏季芭乐</span>';
        title.style.cssText = 'font-size:15px; color:#333; text-align:center; margin-bottom:5px; border-bottom:1px solid #eee; padding-bottom:8px; line-height:1.4;';
        panel.appendChild(title);

        function createBtn(text, bgColor) {
            const btn = document.createElement('button');
            btn.innerText = text;
            btn.style.cssText = `padding:10px 15px; background-color:${bgColor}; color:white; border:none; border-radius:6px; font-size:14px; cursor:pointer; font-weight:bold; transition:all 0.2s ease;`;
            btn.onmouseover = () => { btn.style.transform = 'translateY(-2px)'; btn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'; };
            btn.onmouseout = () => { btn.style.transform = 'translateY(0)'; btn.style.boxShadow = 'none'; };
            panel.appendChild(btn);
            return btn;
        }

        const btnCopy = createBtn('📋 复制带答案版', '#2196F3');
        const btnDownloadAll = createBtn('📦 导出带答案版 (MD格式)', '#9C27B0');
        const btnDownloadBlank = createBtn('📝 导出纯净版 (无答案测验)', '#FF9800');
        const btnDownloadWrong = createBtn('❌ 仅导出错题本', '#F44336');

        // 绑定点击事件
        btnCopy.onclick = async function() {
            const text = getQuestions(false, true);
            if (!text) return;
            await navigator.clipboard.writeText(text);
            let oldText = btnCopy.innerText;
            btnCopy.innerText = '✅ 复制成功！';
            setTimeout(() => btnCopy.innerText = oldText, 2000);
        };

        btnDownloadAll.onclick = () => {
            let text = getQuestions(false, true);
            if(text) downloadFile(text, '学习通复习资料(含答案).md');
        };

        btnDownloadBlank.onclick = () => {
            let text = getQuestions(false, false);
            if(text) downloadFile(text, '学习通自测卷(无答案).md');
        };

        btnDownloadWrong.onclick = () => {
            let text = getQuestions(true, true);
            if(text) downloadFile(text, '学习通错题本.md');
        };
    }

    // ================= 2. 修复排版与懒加载图片的黑科技 =================
    function extractTextWithImages(element) {
        if (!element) return "";
        let clone = element.cloneNode(true);
        
        clone.querySelectorAll('img').forEach(img => {
            let realSrc = img.getAttribute('data-src') || img.getAttribute('src') || '';
            if (realSrc && !realSrc.startsWith('data:image')) {
                let mdImg = document.createTextNode(`\n![图片](${realSrc})\n`);
                img.parentNode.replaceChild(mdImg, img);
            } else {
                img.parentNode.replaceChild(document.createTextNode('[图片]'), img);
            }
        });

        let hiddenDiv = document.createElement('div');
        hiddenDiv.style.cssText = 'position:absolute; left:-9999px; visibility:hidden; width:800px;';
        hiddenDiv.appendChild(clone);
        document.body.appendChild(hiddenDiv);
        
        let finalStr = hiddenDiv.innerText.replace(/\n{3,}/g, '\n\n').trim(); 
        document.body.removeChild(hiddenDiv); 
        
        return finalStr;
    }

    // ================= 3. 提取引擎 =================
    function getQuestions(onlyWrong = false, includeAnswer = true) {
        let resultText = includeAnswer ? "# 📖 学习通复习资料 (含答案)\n\n" : "# 📝 学习通模拟自测卷 (无答案版)\n\n";
        let questions = document.querySelectorAll('div.questionLi');
        
        let extractedCount = 0;

        questions.forEach((q, index) => {
            if (onlyWrong) {
                let wrongIcon = q.querySelector('.mark_score .cuo'); 
                let scoreZero = q.querySelector('.mark_score') && q.querySelector('.mark_score').innerText.includes('0 分');
                if (!wrongIcon && !scoreZero) return; 
            }

            extractedCount++;

            let titleEl = q.querySelector('h3.mark_name');
            if (titleEl) resultText += `### ${extractTextWithImages(titleEl)}\n\n`;
            
            let options = q.querySelectorAll('ul.mark_letter li');
            options.forEach(opt => {
                resultText += `- ${extractTextWithImages(opt)}\n`;
            });
            
            resultText += "\n";
            
            if (includeAnswer) {
                let answerEl = q.querySelector('.mark_answer');
                if (answerEl) {
                    let ansText = extractTextWithImages(answerEl);
                    if (ansText !== "") resultText += `> **💡 答案与解析：**\n> ${ansText.replace(/\n/g, '\n> ')}\n\n`;
                }
            }
            
            resultText += "---\n\n"; 
        });

        if (extractedCount === 0) {
            alert(onlyWrong ? "🎉 太强了，当前页面一道错题都没有！" : "没有提取到内容。");
            return null;
        }
        return resultText;
    }

  // ================= 4. 下载引擎 =================
function downloadFile(content, filename) {
    // \uFEFF 是 UTF-8 的 BOM (Byte Order Mark) 头部
    // 加上它之后，Windows 记事本和 Excel 就能瞬间识别出这是 UTF-8 编码，不再会报错或乱码
    const blob = new Blob([\uFEFF' + content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

})();
