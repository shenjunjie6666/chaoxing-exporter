// ==UserScript==
// @name         学习通提取助手 (终极版)
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  支持Markdown排版、图片抓取、一键复制与错题本提取
// @match        *://*.chaoxing.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ================= 1. 打造终极控制面板 =================
    const panel = document.createElement('div');
    panel.style.cssText = 'position:fixed; bottom:30px; right:30px; z-index:9999; display:flex; flex-direction:column; gap:12px; background:rgba(255, 255, 255, 0.95); padding:15px; border-radius:12px; box-shadow:0 8px 24px rgba(0,0,0,0.2); border:1px solid #e0e0e0; backdrop-filter: blur(10px);';
    document.body.appendChild(panel);

    const title = document.createElement('div');
    title.innerText = '🚀 提取助手 V3.0';
    title.style.cssText = 'font-size:14px; font-weight:bold; color:#333; text-align:center; margin-bottom:5px; border-bottom:1px solid #eee; padding-bottom:8px;';
    panel.appendChild(title);

    // 辅助函数：快速创建按钮
    function createBtn(text, bgColor) {
        const btn = document.createElement('button');
        btn.innerText = text;
        btn.style.cssText = `padding:10px 15px; background-color:${bgColor}; color:white; border:none; border-radius:6px; font-size:14px; cursor:pointer; font-weight:bold; transition:all 0.2s;`;
        btn.onmouseover = () => btn.style.transform = 'scale(1.05)';
        btn.onmouseout = () => btn.style.transform = 'scale(1)';
        panel.appendChild(btn);
        return btn;
    }

    const btnCopy = createBtn('📋 一键复制 (Markdown)', '#2196F3'); // 蓝色
    const btnDownloadAll = createBtn('📦 导出全部 (包含图片)', '#9C27B0'); // 紫色
    const btnDownloadWrong = createBtn('❌ 仅导出错题本', '#F44336'); // 红色

    // ================= 2. 核心黑科技：图片解析与排版 =================
    
    // 突破图片限制：把 HTML 里的图片完美转换成 Markdown 格式
    function extractTextWithImages(element) {
        if (!element) return "";
        // 克隆一个隐形的盒子进行处理，不破坏原网页结构
        let clone = element.cloneNode(true);
        let imgs = clone.querySelectorAll('img');
        imgs.forEach(img => {
            // 把图片标签替换成 Markdown 的图片语法：![图片](图片链接)
            let mdImg = document.createTextNode(`\n![图片](${img.src})\n`);
            img.parentNode.replaceChild(mdImg, img);
        });
        return clone.innerText.replace(/\s+/g, ' ').trim();
    }

    // 主提取逻辑
    function getQuestions(onlyWrong = false) {
        let resultText = "# 📖 学习通复习资料\n\n";
        let questions = document.querySelectorAll('div.questionLi');
        
        if (questions.length === 0) {
            alert("页面上没有找到题目，请确认是否在练习题页面！");
            return null;
        }

        let extractedCount = 0;

        questions.forEach((q, index) => {
            // 错题本模式：智能识别该题是否做错
            if (onlyWrong) {
                let html = q.innerHTML;
                // 常见错题特征：得分为0、有错误图标(cuo)、字体标红等
                let isWrong = html.includes('0 分') || html.includes('cuo') || html.includes('colorRed');
                if (!isWrong) return; // 如果没错，直接跳过这题
            }

            extractedCount++;

            // 提取题干 (使用 Markdown 的三级标题 ###)
            let titleEl = q.querySelector('h3.mark_name');
            if (titleEl) {
                resultText += `### ${extractTextWithImages(titleEl)}\n\n`;
            }
            
            // 提取选项 (使用 Markdown 的无序列表 - )
            let options = q.querySelectorAll('ul.mark_letter li');
            options.forEach(opt => {
                resultText += `- ${extractTextWithImages(opt)}\n`;
            });
            
            resultText += "\n";
            
            // 提取答案和解析 (使用 Markdown 的引用区块 > )
            let answerEl = q.querySelector('.mark_answer');
            if (answerEl) {
                let ansText = extractTextWithImages(answerEl);
                if (ansText !== "") {
                    resultText += `> **💡 答案与解析：**\n> ${ansText}\n\n`;
                }
            }
            
            resultText += "---\n\n"; // Markdown 分割线
        });

        if (extractedCount === 0) {
            alert(onlyWrong ? "太棒了，当前页面没有任何错题！🎉" : "没有提取到内容。");
            return null;
        }

        return resultText;
    }

    // ================= 3. 按钮交互事件 =================
    
    // 功能一：一键复制到剪贴板
    btnCopy.onclick = async function() {
        const text = getQuestions(false);
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            btnCopy.innerText = '✅ 复制成功，快去粘贴！';
            setTimeout(() => btnCopy.innerText = '📋 一键复制 (Markdown)', 3000);
        } catch (err) {
            alert('复制失败，请尝试使用导出功能！');
        }
    };

    // 功能二：全量导出
    btnDownloadAll.onclick = function() {
        const text = getQuestions(false);
        if (!text) return;
        downloadFile(text, '学习通复习资料_全量.md');
    };

    // 功能三：仅导出错题
    btnDownloadWrong.onclick = function() {
        const text = getQuestions(true);
        if (!text) return;
        downloadFile(text, '学习通错题本_专属.md');
    };

    // 辅助函数：触发文件下载 (后缀改为 .md)
    function downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
})();
