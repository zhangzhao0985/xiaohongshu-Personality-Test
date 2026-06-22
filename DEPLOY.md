# 正式上线指南 · 大陆服务器 + 域名备案

这份是给「正式上线、面向大陆用户」的保姆级步骤。整套是标准 Node 服务，部署到任意大陆云服务器都行。

> ⚠️ 先说清楚：**买服务器、买域名、ICP 备案、域名解析**这几步都要用你的实名认证和账号，我（AI）无法代办。下面把每一步写清楚，你照着做或交给技术朋友即可。

---

## 0. 总流程一眼看懂

```
买大陆服务器  →  买域名  →  提交ICP备案(1~3周)  →  备案通过
   ↓                                                ↓
装 Node + 部署代码  →  systemd 守护  →  Nginx 反代 + HTTPS  →  域名解析到服务器
   ↓
填 app.js 配置(店铺名/备案号)  →  /admin 录入订单号  →  真机自测  →  上线
```

---

## 1. 买服务器
- 推荐 **阿里云 / 腾讯云「轻量应用服务器」**，配置 **2核2G、3~5M 带宽** 起步即可。
- 地域选 **中国大陆**（上海 / 广州 / 北京等）。
- 系统镜像选 **Ubuntu 22.04 LTS**（或 Alibaba Cloud Linux / 宝塔面板镜像）。
- 记下公网 **IP**。
- 👉 不想敲命令的话，可以买**带「宝塔面板」的镜像**，用图形界面装 Node 项目、配反代和证书，更适合非技术同学（第 5、6 步可在宝塔里点几下完成）。

## 2. 买域名 + ICP 备案（最耗时，越早开始越好）
1. 在**同一家云厂商**买域名（`.com` / `.cn`）。
2. 在该云厂商的「**备案系统**」提交 **ICP 备案**（个人或企业主体），需身份证、人脸核验、拍幕布照等，审核约 **1~3 周**。
3. 备案通过会拿到 **ICP 备案号**（如 `粤ICP备12345678号-1`）→ 填进 `app.js` 的 `CONFIG.ICP_BEIAN`，会自动显示在首页底部。
4. 备案通过后，再到「**公安网备**」登记。
5. ⚠️ **未备案的域名在大陆服务器上无法通过 80/443 正常访问**，所以备案是上线前提。

## 3. 装 Node 环境（SSH 登录服务器后）
```bash
# Ubuntu：装 Node 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt-get install -y nodejs git
node -v   # 看到 v18.x 即可
```

## 4. 部署代码
```bash
sudo mkdir -p /var/www && cd /var/www
git clone <你的仓库地址> yuwang-test
cd yuwang-test
sudo chown -R www-data:www-data /var/www/yuwang-test   # 让服务进程能写 data/
# 先手动试跑（临时在安全组放行 8787）
ADMIN_TOKEN=先随便填个强口令 TOKEN_SECRET=再来一串随机字 node server.js
# 浏览器访问 http://你的IP:8787 看是否正常，正常后 Ctrl+C 停掉
```
> 订单数据会存在 `./data/orders.json`，确保这个目录在**持久磁盘**上（普通云服务器默认就是，免费 Serverless 不行）。

## 5. systemd 守护（开机自启 + 崩溃自动重启）
```bash
sudo cp deploy/yuwang-test.service /etc/systemd/system/
sudo nano /etc/systemd/system/yuwang-test.service   # 改里面的路径/用户/ADMIN_TOKEN/TOKEN_SECRET/域名
sudo systemctl daemon-reload
sudo systemctl enable --now yuwang-test
sudo systemctl status yuwang-test                    # 看到 active (running) 即成功
```
> 也可用 pm2：`sudo npm i -g pm2 && pm2 start server.js --name yuwang && pm2 save && pm2 startup`

## 6. Nginx 反向代理 + HTTPS
```bash
sudo apt-get install -y nginx
sudo cp deploy/nginx.conf.example /etc/nginx/conf.d/yuwang.conf
sudo nano /etc/nginx/conf.d/yuwang.conf   # 改成你的域名和证书路径
```
**证书二选一：**
- 云厂商**免费 SSL 证书**（阿里云/腾讯云控制台申请「域名型 DV 证书」，下载 Nginx 版，传到服务器，路径填进上面的 conf）。
- 或 **certbot 自动签**：`sudo apt-get install -y certbot python3-certbot-nginx && sudo certbot --nginx -d 你的域名`
```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 7. 安全组 / 防火墙
- 只对外开放 **80、443、22(SSH)**。
- **关闭对外的 8787**（只让本机 Nginx 访问后端），避免绕过反代直连。

## 8. 配置前端（`app.js` 顶部 `CONFIG`）
```js
SHOP_NAME: "小叭的店铺名",
SHOP_URL:  "你的小红书店铺链接",   // 可留空
ICP_BEIAN: "粤ICP备12345678号-1", // 备案号，显示在首页底部
API_BASE:  "",                    // 同服务器留空
```
改完 `git pull` 或重新上传后，`sudo systemctl restart yuwang-test`。

## 9. 录入订单号
访问 `https://你的域名/admin`，填入 `ADMIN_TOKEN`，把小红书后台**导出的订单号**粘进去（或生成解锁码）。买家即可自动验证解锁。

---

## ✅ 上线检查清单
- [ ] 域名已**备案通过**、已解析到服务器、能用 **https** 打开
- [ ] `app.js`：`SHOP_NAME` / `SHOP_URL` / `ICP_BEIAN` 已填好
- [ ] 服务器已设**强** `ADMIN_TOKEN` 与 `TOKEN_SECRET`（千万别用示例里的默认值）
- [ ] 安全组仅开放 80/443/22，**8787 不对外**
- [ ] systemd / pm2 已设开机自启，**重启服务器后仍能访问**
- [ ] `/admin` 能登录并成功录入订单号
- [ ] 真机走一遍：弹窗 → 输订单号 → 答 20 题 → 出结果 → 生成分享图
- [ ] `data/` 在持久磁盘，且已配置**定期备份**
- [ ] 首页底部显示**备案号**并能点到 beian.miit.gov.cn

## 🗂 数据备份（很重要，订单库别丢）
```bash
# 每天凌晨 3 点备份一份订单库
echo '0 3 * * * cp /var/www/yuwang-test/data/orders.json /var/backups/orders-$(date +\%F).json' | sudo tee -a /var/spool/cron/crontabs/root
```

## 🔄 以后更新代码
```bash
cd /var/www/yuwang-test && git pull && sudo systemctl restart yuwang-test
```

## 🐳 （可选）用 Docker 部署
仓库根目录已带 `Dockerfile`：
```bash
docker build -t yuwang-test .
docker run -d --name yuwang -p 8787:8787 \
  -e ADMIN_TOKEN=你的强口令 -e TOKEN_SECRET=随机字 -e ALLOW_ORIGIN=https://你的域名 \
  -v /var/data/yuwang:/app/data --restart always yuwang-test
```
（外层仍建议用 Nginx 反代 + HTTPS。）
