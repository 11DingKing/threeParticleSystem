# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Build
# Uses --platform=$BUILDPLATFORM so the Node toolchain always runs on the host
# machine (fast), while the final image targets any platform (ARM64 / AMD64).
# ─────────────────────────────────────────────────────────────────────────────
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder

WORKDIR /app

# Install dependencies with pinned versions (package.json, no lock-file needed
# for a deterministic single-version dep set)
COPY package.json ./
RUN npm install --omit=dev

# Copy application source
COPY scripts/ scripts/
COPY index.html nginx.conf ./
COPY css/ css/
COPY js/  js/

# ── Vendor assets: copy runtime libs out of node_modules ─────────────────────
# This makes the final image fully self-contained (no CDN required at runtime).
# We use the same script as local development (npm run copy-vendor) to ensure consistency.

RUN npm run copy-vendor && \
    mkdir -p dist && \
    cp -r index.html css js vendor dist/ && \
    \
    echo "=== Build summary ===" && \
    echo "three.module.min.js : $(wc -c < dist/vendor/three/three.module.min.js) bytes" && \
    echo "App JS modules      : $(find dist/js -name '*.js' | wc -l) files" && \
    echo "MediaPipe hands     : $(ls dist/vendor/mediapipe/hands/ | wc -l) files" && \
    echo "MediaPipe cam_utils : $(ls dist/vendor/mediapipe/camera_utils/ | wc -l) files"

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Runtime
# nginx:alpine supports both linux/amd64 (x86_64) and linux/arm64 (ARM).
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist      /usr/share/nginx/html
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
