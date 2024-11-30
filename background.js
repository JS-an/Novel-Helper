// background.js

console.log('background.js 已启动');

// 监听快捷键命令
chrome.commands.onCommand.addListener((command) => {
  console.log(`接收到命令: ${command}`);
  if (command === "toggle-display") {
    // 获取当前活动的标签页
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        const activeTab = tabs[0];
        console.log(`向标签页 ${activeTab.id} 发送消息`);
        // 发送消息给内容脚本，并处理可能的错误
        chrome.tabs.sendMessage(activeTab.id, { action: "toggle-display" }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn(`无法向标签页 ${activeTab.id} 发送消息: ${chrome.runtime.lastError.message}`);
            // 显示通知给用户
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'icons/icon48.png',
              title: '扩展通知',
              message: '无法切换显示状态，请重试或检查页面。'
            });
          } else {
            console.log('消息发送成功:', response);
          }
        });
      } else {
        console.warn('未找到活动的标签页');
      }
    });
  }
});

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('收到消息:', request);
  if (request.action === 'fetchUrl') {
    const url = request.url;
    console.log(`后台接收到 fetchUrl 请求: ${url}`);

    // 使用 fetch API 获取 URL 内容
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`网络响应不是 OK: ${response.statusText}`);
        }
        return response.arrayBuffer();
      })
      .then(buffer => {
        let decodedText;
        try {
          if (url.includes('69shuba.cx')) {
            // 使用 TextDecoder 解码 GBK 编码的内容
            const decoder = new TextDecoder('gbk');
            decodedText = decoder.decode(buffer);
            return decodedText;
          } else {
            // 使用 TextDecoder 解码 UTF-8 编码的内容
            const decoder = new TextDecoder('utf-8');
            decodedText = decoder.decode(buffer);
            return decodedText;
          }
        } catch (error) {
          sendResponse({ success: false, error });
          return;
        }
      })
      .then(data => {
        if (data) {
          // 返回获取到的 HTML 内容
          sendResponse({ success: true, data });
        }
      })
      .catch(error => {
        console.error(`获取 URL 内容失败: ${error.message}`);
        sendResponse({ success: false, error: error.message });
      });

    // 返回 `true` 以指示 sendResponse 是异步调用
    return true;
  }
});
