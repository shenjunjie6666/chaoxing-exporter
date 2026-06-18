// ==UserScript==
// @name         学习通提取助手 (Pro版)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  一键提取学习通练习题（含答案解析）为文本文档
// @match        *://*.chaoxing.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 1. 创建悬浮按钮 (升级为尊贵的紫色)
    const btn = document.createElement('button');
    btn.innerText = '一键导出(含答案)';
    btn.style.position = 'fixed';
    btn.style.bottom = '50px';
    btn.style.right = '50px';
    btn.style.padding = '15px 20px';
    btn.style.backgroundColor = '#9C27B0'; // 改成紫色区分版本
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.borderRadius = '8px';
    btn.style.fontSize = '16px';
    btn.style.cursor = 'pointer';
    btn.style.zIndex = '9999';
    btn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
    document.body.appendChild(btn);

    // 2. 提取逻辑
    btn.onclick = function() {
        let resultText = "=== 学习通练习题及答案提取 ===\n\n";
        let questions = document.querySelectorAll('div.questionLi');
        
        if (questions.length === 0) {
            alert("页面上没有找到题目，请确认是否在练习题页面！");
            return;
        }

        questions.forEach((q, index) => {
            // 提取题干
            let titleEl = q.querySelector('h3.mark_name');
            if (titleEl) {
                resultText += titleEl.innerText.replace(/\s+/g, ' ').trim() + "\n";
            }
            
            // 提取选项
            let options = q.querySelectorAll('ul.mark_letter li');
            options.forEach(opt => {
                resultText += opt.innerText.replace(/\s+/g, ' ').trim() + "\n";
            });
            
            // 【本次升级核心：提取答案和解析】
            let answerEl = q.querySelector('.mark_answer');
            if (answerEl) {
                let answerText = answerEl.innerText.replace(/\s+/g, ' ').trim();
                // 只有当有答案时才写入，防止空白
                if (answerText !== "") {
                    resultText += "👉 " + answerText + "\n";
                }
            }
            
            resultText += "\n------------------------\n\n"; // 题目之间加分割线，更美观
        });

        // 3. 自动下载
        const blob = new Blob([resultText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '学习通练习题(含答案).txt';
        a.click();
        URL.revokeObjectURL(url);
        
        // 按钮交互反馈
        btn.innerText = '导出成功！';
        btn.style.backgroundColor = '#4CAF50';
        setTimeout(() => { btn.innerText = '一键导出(含答案)'; btn.style.backgroundColor = '#9C27B0'; }, 3000);
    };
})();
