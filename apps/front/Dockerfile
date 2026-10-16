FROM node:20-alpine AS builder

WORKDIR /app/apps/front

# Install pnpm
RUN npm install -g pnpm

# Copy only front files
COPY apps/front/package.json ./
COPY apps/front ./ 

# Install ALL deps including devDependencies (sin workspace, sin lockfile)
RUN pnpm install --no-frozen-lockfile

# Build
RUN pnpm run build

FROM nginx:alpine

COPY apps/front/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/apps/front/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]