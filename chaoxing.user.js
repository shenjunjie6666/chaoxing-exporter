// ==UserScript==
// @name         学习通提取助手
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  一键提取学习通练习题为文本文档
// @match        *://*.chaoxing.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 1. 在网页右下角创建一个悬浮的“提取”按钮
    const btn = document.createElement('button');
    btn.innerText = '一键导出题目';
    btn.style.position = 'fixed';
    btn.style.bottom = '50px';
    btn.style.right = '50px';
    btn.style.padding = '15px 20px';
    btn.style.backgroundColor = '#4CAF50';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.borderRadius = '8px';
    btn.style.fontSize = '16px';
    btn.style.cursor = 'pointer';
    btn.style.zIndex = '9999';
    btn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
    document.body.appendChild(btn);

    // 2. 设置点击按钮后执行的提取逻辑
    btn.onclick = function() {
        let resultText = "=== 学习通练习题提取 ===\n\n";
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
            
            resultText += "\n";
        });

        // 3. 将提取的文字生成 txt 文件并自动下载
        const blob = new Blob([resultText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '学习通练习题_已导出.txt';
        a.click();
        URL.revokeObjectURL(url);
        
        // 改变按钮文字提示成功
        btn.innerText = '导出成功！';
        btn.style.backgroundColor = '#008CBA';
        setTimeout(() => { btn.innerText = '一键导出题目'; btn.style.backgroundColor = '#4CAF50'; }, 3000);
    };
})();
