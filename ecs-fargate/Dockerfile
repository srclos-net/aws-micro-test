ARG FUNCTION_DIR="/app"

FROM node:lts-alpine

ARG FUNCTION_DIR
RUN mkdir -p ${FUNCTION_DIR}
COPY . ${FUNCTION_DIR}

WORKDIR ${FUNCTION_DIR}
RUN npm install --production
CMD ["node", "index.js"]
EXPOSE 3000