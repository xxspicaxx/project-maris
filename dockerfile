FROM python:3.11-slim
WORKDIR /workspace
# Install git atau tools lain jika butuh
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
# Tambahkan ini di baris paling bawah dockerfile jika belum ada
CMD ["bash"]