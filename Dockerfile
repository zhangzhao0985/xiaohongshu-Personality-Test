# 零依赖应用，镜像很小。数据请用 -v 挂载到 /app/data 持久化。
FROM node:18-alpine
WORKDIR /app
COPY . .
ENV NODE_ENV=production
ENV PORT=8787
EXPOSE 8787
CMD ["node", "server.js"]
