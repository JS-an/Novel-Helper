// content.js

console.log('content.js 已成功注入并运行');

(function () {
  // 避免创建多个容器
  if (document.getElementById('floating-txtnav-page')) return;

  // 创建浮动容器
  const container = document.createElement('div');
  container.id = 'floating-txtnav-page';
  container.style.display = 'none';
  container.style.position = 'fixed';
  container.style.bottom = '20px';
  container.style.right = '20px';
  container.style.width = '280px';
  container.style.height = '200px';
  container.style.zIndex = '10000';

  // 使用 Shadow DOM 来隔离样式和结构
  const shadow = container.attachShadow({ mode: 'open' });

  // 加载模板
  fetch(chrome.runtime.getURL('template.html'))
    .then(response => response.text())
    .then(html => {
      shadow.innerHTML = html;
      initialize(shadow);
    })
    .catch(error => {
      console.error('无法加载模板:', error);
    });

  // 将容器添加到页面
  document.body.appendChild(container);

  // 初始化函数
  function initialize(shadow) {
    // 获取元素引用
    const closeButton = shadow.getElementById('my-close-button');
    const urlInput = shadow.getElementById('my-url-input');
    const loadButton = shadow.getElementById('my-load-button');
    const contentArea = shadow.getElementById('my-content-area');

    // 关闭按钮事件
    closeButton.addEventListener('click', () => {
      container.style.display = 'none';
    });

    // 确定按钮事件
    loadButton.addEventListener('click', () => {
      const url = urlInput.value.trim();
      if (url) {
        // 简单的URL验证
        try {
          new URL(url);
          loadURLContent(url);
        } catch (e) {
          alert('请输入有效的 URL。');
        }
      }
    });

    // 函数：加载指定 URL 的内容
    function loadURLContent(url) {
      console.log(`加载 URL: ${url}`);
      // 显示加载中状态
      contentArea.innerHTML = `
        <div class="loader-container">
          <div class="loader"></div>
          <p>加载中...</p>
        </div>
      `;

      // 发送消息到后台脚本请求获取 URL 内容
      chrome.runtime.sendMessage({ action: 'fetchUrl', url }, (response) => {
        if (chrome.runtime.lastError) {
          console.error(`消息发送失败: ${chrome.runtime.lastError.message}`);
          contentArea.innerHTML = `<p class="error">加载失败: ${chrome.runtime.lastError.message}</p>`;
          return;
        }

        if (response && response.success) {
          const htmlText = response.data;
          console.log('成功获取 URL 内容');

          // 解析HTML
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlText, 'text/html');

          // 清空内容区域
          contentArea.innerHTML = '';

          // 提取并克隆 .txtnav 元素
          const txtnav = doc.querySelector('.txtnav');
          if (txtnav) {
            const txtnavClone = txtnav.cloneNode(true);
            contentArea.appendChild(txtnavClone);
          } else {
            const noTxtnav = document.createElement('p');
            noTxtnav.textContent = '未找到 .txtnav 元素。';
            contentArea.appendChild(noTxtnav);
          }

          // 提取并克隆 .page1 元素
          const page1 = doc.querySelector('.page1');
          if (page1) {
            const page1Clone = page1.cloneNode(true);
            contentArea.appendChild(page1Clone);
          } else {
            const noPage1 = document.createElement('p');
            noPage1.textContent = '未找到 .page1 元素。';
            contentArea.appendChild(noPage1);
          }

          // 更新URL输入框
          urlInput.value = url;

          // 显示容器
          container.style.display = 'block';

          // 添加 a 标签点击事件监听器
          addLinkListeners(doc, url);
        } else {
          const errorMsg = response && response.error ? response.error : '未知错误';
          console.log('加载失败:', errorMsg);
          contentArea.innerHTML = `<p class="error">加载失败: ${errorMsg}</p>`;
        }
      });
    }

    // 函数：添加 a 标签的点击事件监听器（事件委托）
    function addLinkListeners(doc, baseUrl) {
      contentArea.addEventListener('click', (event) => {
        if (event.target.tagName.toLowerCase() === 'a' && event.target.href) {
          event.preventDefault();
          // 处理相对链接
          try {
            const absoluteUrl = new URL(event.target.getAttribute('href'), baseUrl).href;
            urlInput.value = absoluteUrl;
            loadURLContent(absoluteUrl);
          } catch (error) {
            alert('无法解析链接 URL。');
            console.error('URL 解析错误:', error);
          }
        }
      });
    }

    // 监听来自后台脚本的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('收到消息:', request);
      if (request.action === "toggle-display") {
        if (container.style.display === 'none') {
          container.style.display = 'block';
        } else {
          container.style.display = 'none';
        }
        sendResponse({ status: 'success' });
      }
    });
  }
})();
