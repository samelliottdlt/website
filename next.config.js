module.exports = {
  reactStrictMode: true,
  images: {
    domains: ['tailwindui.com'],
  },
  async rewrites() {
    return [
      {
        source: "/beluga",
        destination:
          "https://sams-awesome-space.nyc3.digitaloceanspaces.com/index.html",
      },
      {
        source: "/beluga/:slug",
        destination:
          "https://sams-awesome-space.nyc3.digitaloceanspaces.com/index.html/:slug",
      },
    ];
  },
};
