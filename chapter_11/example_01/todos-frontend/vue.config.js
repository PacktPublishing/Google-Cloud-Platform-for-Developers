const backendUrl = process.env.BACKEND_URL ||
  (process.env.NODE_ENV == 'production'
    ? `https://todos-backend-dot-${process.env.GCLOUD_PROJECT}.appspot.com`
    : 'localhost:8081');

console.log('Initializing Vue development proxy. Backend URL:', backendUrl);

module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true
      },
    },
    port: 5000
  }
}
