// content.js

// 配置 url 对应的内容和翻页元素的选择器
const urlToEle = (url) => {
  if (url.includes('69shuba.cx')) {
    return {
      content: '.txtnav',
      page: '.page1'
    }
  }
  if (url.includes('qidian.com')) {
    return {
      content: 'main',
      page: '.nav-btn-group'
    }
  }
  if (url.includes('xiaoshubao.net')) {
    return {
      content: '#content',
      page: '.bottem2'
    }
  }
  return {
    content: '#content',
    page: '.bottem2'
  }
}

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

    // 新增元素引用
    const historyButton = shadow.getElementById('my-history-button');
    const configButton = shadow.getElementById('my-config-button');
    const historyModal = shadow.getElementById('my-history-modal');
    const historyCloseButton = shadow.getElementById('history-close-button');
    const historyList = shadow.getElementById('history-list');
    const noHistoryMessage = shadow.getElementById('no-history-message');

    const configModal = shadow.getElementById('my-config-modal');
    const configCloseButton = shadow.getElementById('config-close-button');
    const saveConfigButton = shadow.getElementById('save-config-button');
    const cancelConfigButton = shadow.getElementById('cancel-config-button');
    const fontSizeInput = shadow.getElementById('font-size-input');
    const fontColorInput = shadow.getElementById('font-color-input');
    const backgroundColorInput = shadow.getElementById('background-color-input');
    const widthInput = shadow.getElementById('width-input');
    const heightInput = shadow.getElementById('height-input');
    const fontOpacityInput = shadow.getElementById('font-opacity-input');
    const backgroundOpacityInput = shadow.getElementById('background-opacity-input');

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
          saveHistory(url);
        } catch (e) {
          alert('请输入有效的 URL。');
        }
      }
    });

    // 历史记录按钮事件
    historyButton.addEventListener('click', () => {
      renderHistory();
      historyModal.style.display = 'block';
    });

    // 配置按钮事件
    configButton.addEventListener('click', () => {
      loadConfig();
      configModal.style.display = 'block';
    });

    // 历史记录模态窗口关闭事件
    historyCloseButton.addEventListener('click', () => {
      historyModal.style.display = 'none';
    });

    // 配置模态窗口关闭事件
    configCloseButton.addEventListener('click', () => {
      configModal.style.display = 'none';
    });

    // 配置保存按钮事件
    saveConfigButton.addEventListener('click', () => {
      saveConfig();
      applyConfig();
      configModal.style.display = 'none';
    });

    // 配置取消按钮事件
    cancelConfigButton.addEventListener('click', () => {
      configModal.style.display = 'none';
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

          const { content, page } = urlToEle(url);
          console.log(doc)

          // 提取并克隆内容元素
          const txtnav = doc.querySelector(content);
          if (txtnav) {
            const txtnavClone = txtnav.cloneNode(true);
            contentArea.appendChild(txtnavClone);
          } else {
            const noTxtnav = document.createElement('p');
            noTxtnav.textContent = `未找到 ${content} 元素。`;
            contentArea.appendChild(noTxtnav);
          }

          // 提取并克隆翻页元素
          const page1 = doc.querySelector(page);
          if (page1) {
            const page1Clone = page1.cloneNode(true);
            contentArea.appendChild(page1Clone);
          } else {
            const noPage1 = document.createElement('p');
            noPage1.textContent = `未找到 ${page} 元素。`;
            contentArea.appendChild(noPage1);
          }

          // 更新URL输入框
          urlInput.value = url;

          // 显示容器
          container.style.display = 'block';

          // 添加 a 标签点击事件监听器
          addLinkListeners(doc, url);

          // 应用配置设置
          applyConfig();
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
            saveHistory(absoluteUrl);
          } catch (error) {
            alert('无法解析链接 URL。');
            console.error('URL 解析错误:', error);
          }
        }
      });
    }

    // 函数：保存历史记录
    function saveHistory(url) {
      const urlObj = new URL(url);
      const topDomain = urlObj.hostname.split('.').slice(-2).join('.');

      let history = JSON.parse(localStorage.getItem('extensionHistory')) || {};

      if (!history[topDomain]) {
        history[topDomain] = [];
      }

      // 避免重复
      if (!history[topDomain].includes(url)) {
        history[topDomain].unshift(url); // 将新URL添加到最前面
        // 限制每个顶级域名的历史记录数量为3条
        if (history[topDomain].length > 3) {
          history[topDomain] = history[topDomain].slice(0, 3);
        }
        localStorage.setItem('extensionHistory', JSON.stringify(history));
      }
    }

    // 函数：渲染历史记录
    function renderHistory() {
      const history = JSON.parse(localStorage.getItem('extensionHistory')) || {};
      historyList.innerHTML = '';

      let hasHistory = false;

      for (const domain in history) {
        const urls = history[domain];
        if (urls.length > 0) {
          hasHistory = true;
          const domainHeader = document.createElement('h3');
          domainHeader.textContent = domain;
          historyList.appendChild(domainHeader);

          const ul = document.createElement('ul');
          urls.forEach(url => {
            const li = document.createElement('li');
            const link = document.createElement('a');
            link.href = '#';
            link.textContent = url;
            link.addEventListener('click', (e) => {
              e.preventDefault();
              urlInput.value = url;
              loadURLContent(url);
              historyModal.style.display = 'none';
            });
            li.appendChild(link);
            ul.appendChild(li);
          });
          historyList.appendChild(ul);
        }
      }

      noHistoryMessage.style.display = hasHistory ? 'none' : 'block';
    }

    // 函数：加载配置设置
    function loadConfig() {
      const config = JSON.parse(localStorage.getItem('extensionConfig')) || {
        fontSize: 14,
        fontColor: '#888888',
        backgroundColor: '#00000022',
        width: 280,
        height: 200,
        fontOpacity: 0.5,
        backgroundOpacity: 0.2
      };
      fontSizeInput.value = config.fontSize;
      fontColorInput.value = config.fontColor;
      backgroundColorInput.value = config.backgroundColor;
      widthInput.value = config.width;
      heightInput.value = config.height;
      fontOpacityInput.value = config.fontOpacity;
      backgroundOpacityInput.value = config.backgroundOpacity;
    }

    // 函数：保存配置设置
    function saveConfig() {
      const config = {
        fontSize: fontSizeInput.value,
        fontColor: fontColorInput.value,
        backgroundColor: backgroundColorInput.value,
        width: widthInput.value,
        height: heightInput.value,
        fontOpacity: fontOpacityInput.value,
        backgroundOpacity: backgroundOpacityInput.value
      };
      localStorage.setItem('extensionConfig', JSON.stringify(config));
    }

    // 辅助函数：将颜色和值转换为带透明度的 RGBA 颜色
    function applyOpacity(hexColor, opacity) {
      // 移除 '#' 符号
      hexColor = hexColor.replace('#', '');
      
      // 处理 3 位和 6 位颜色
      if (hexColor.length === 3) {
        hexColor = hexColor.split('').map(c => c + c).join('');
      }
      
      const bigint = parseInt(hexColor, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;

      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    // 函数：应用配置设置
    function applyConfig() {
      const config = JSON.parse(localStorage.getItem('extensionConfig')) || {
        fontSize: 14,
        fontColor: '#888888',
        backgroundColor: '#00000022',
        width: 280,
        height: 200,
        fontOpacity: 0.5,
        backgroundOpacity: 0.2
      };
      contentArea.style.fontSize = `${config.fontSize}px`;
      contentArea.style.color = applyOpacity(config.fontColor, config.fontOpacity);
      container.style.backgroundColor = applyOpacity(config.backgroundColor, config.backgroundOpacity);
      container.style.width = `${config.width}px`;
      container.style.height = `${config.height}px`;
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

    // 点击模态窗口外部区域关闭模态窗口
    window.addEventListener('click', (event) => {
      if (event.target === historyModal) {
        historyModal.style.display = 'none';
      }
      if (event.target === configModal) {
        configModal.style.display = 'none';
      }
    });

    // 初始加载时应用配置
    applyConfig();
  }
})();
