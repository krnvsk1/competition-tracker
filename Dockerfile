FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy source
COPY . .

# Generate Prisma client and build
# RUN npx prisma generate
RUN npm run build

# Initialize database
RUN mkdir -p /app/data
ENV DATABASE_URL=file:/app/data/db.sqlite
RUN npx prisma db push

EXPOSE 3000

CMD ["npm", "start"]
