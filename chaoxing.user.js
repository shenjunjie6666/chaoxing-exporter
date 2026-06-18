// ==UserScript==
// @name         学习通提取助手 (完美版 V3.1)
// @namespace    http://tampermonkey.net/
// @version      3.1
// @description  修复图片懒加载、增加排版保真、新增纯净刷题模式导出
// @match        *://*.chaoxing.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ================= 1. 打造全新控制面板 =================
    const panel = document.createElement('div');
    panel.style.cssText = 'position:fixed; bottom:30px; right:30px; z-index:99999; display:flex; flex-direction:column; gap:10px; background:rgba(255, 255, 255, 0.98); padding:18px; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.15); border:1px solid #e0e0e0; font-family: sans-serif;';
    document.body.appendChild(panel);

    const title = document.createElement('div');
    title.innerHTML = '<b>🚀 提取助手 V3.1</b><br><span style="font-size:12px;color:#666;">By 你的名字(可修改)</span>';
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

    const btnCopy = createBtn('📋 复制带答案版', '#2196F3'); // 蓝
    const btnDownloadAll = createBtn('📦 导出带答案版 (MD格式)', '#9C27B0'); // 紫
    const btnDownloadBlank = createBtn('📝 导出纯净版 (无答案测验)', '#FF9800'); // 橙
    const btnDownloadWrong = createBtn('❌ 仅导出错题本', '#F44336'); // 红

    // ================= 2. 修复排版与懒加载图片的黑科技 =================
    function extractTextWithImages(element) {
        if (!element) return "";
        let clone = element.cloneNode(true);
        
        // 修复1：处理学习通的懒加载图片，优先抓取 data-src
        clone.querySelectorAll('img').forEach(img => {
            let realSrc = img.getAttribute('data-src') || img.getAttribute('src') || '';
            // 剔除无效的base64占位图，转换为 Markdown 语法
            if (realSrc && !realSrc.startsWith('data:image')) {
                let mdImg = document.createTextNode(`\n![图片](${realSrc})\n`);
                img.parentNode.replaceChild(mdImg, img);
            } else {
                img.parentNode.replaceChild(document.createTextNode('[图片]'), img);
            }
        });

        // 修复2：为了让游离DOM保留换行排版，我们建一个隐形的容器把它装进去
        let hiddenDiv = document.createElement('div');
        hiddenDiv.style.cssText = 'position:absolute; left:-9999px; visibility:hidden; width:800px;';
        hiddenDiv.appendChild(clone);
        document.body.appendChild(hiddenDiv);
        
        // 这样取出来的 innerText 才是带有完美换行的格式
        let finalStr = hiddenDiv.innerText.replace(/\n{3,}/g, '\n\n').trim(); 
        document.body.removeChild(hiddenDiv); // 用完就销毁，事了拂衣去
        
        return finalStr;
    }

    // ================= 3. 提取引擎 (支持模式切换) =================
    // onlyWrong: 是否只看错题； includeAnswer: 是否附带答案解析
    function getQuestions(onlyWrong = false, includeAnswer = true) {
        let resultText = includeAnswer ? "# 📖 学习通复习资料 (含答案)\n\n" : "# 📝 学习通模拟自测卷 (无答案版)\n\n";
        let questions = document.querySelectorAll('div.questionLi');
        
        if (questions.length === 0) {
            alert("⚠️ 页面上没找到题目，请确认这是不是做题页面哦！");
            return null;
        }

        let extractedCount = 0;

        questions.forEach((q, index) => {
            // 修复3：通过更底层、更严谨的 class 判断是否为错题 (寻找打叉的图标盒子)
            if (onlyWrong) {
                let wrongIcon = q.querySelector('.mark_score .cuo'); 
                let scoreZero = q.querySelector('.mark_score') && q.querySelector('.mark_score').innerText.includes('0 分');
                if (!wrongIcon && !scoreZero) return; 
            }

            extractedCount++;

            // 题干提取
            let titleEl = q.querySelector('h3.mark_name');
            if (titleEl) resultText += `### ${extractTextWithImages(titleEl)}\n\n`;
            
            // 选项提取
            let options = q.querySelectorAll('ul.mark_letter li');
            options.forEach(opt => {
                resultText += `- ${extractTextWithImages(opt)}\n`;
            });
            
            resultText += "\n";
            
            // 根据参数决定是否提取答案
            if (includeAnswer) {
                let answerEl = q.querySelector('.mark_answer');
                if (answerEl) {
                    let ansText = extractTextWithImages(answerEl);
                    if (ansText !== "") resultText += `> **💡 答案与解析：**\n> ${ansText.replace(/\n/g, '\n> ')}\n\n`; // 让多行解析保持在引用块内
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

    // ================= 4. 按钮交互事件 =================
    function downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

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

})();
