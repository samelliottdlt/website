module.exports = {
  async rewrites() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'beluga.sdelatorrebaba.com',
          }
        ],
        destination: 'https://sams-awesome-space.nyc3.digitaloceanspaces.com/index.html',
      },
    ]
  },
}
