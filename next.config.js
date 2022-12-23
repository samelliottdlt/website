module.exports = {
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
          "https://sams-awesome-space.nyc3.digitaloceanspaces.com/:slug",
      },
      {
        source: "/",
        has: [
          {
            type: "host",
            value: "beluga.sdelatorrebaba.com",
          },
        ],
        destination:
          "https://sams-awesome-space.nyc3.digitaloceanspaces.com/index.html",
      },
      {
        source: "/:slug",
        has: [
          {
            type: "host",
            value: "beluga.sdelatorrebaba.com",
          },
        ],
        destination:
          "https://sams-awesome-space.nyc3.digitaloceanspaces.com/index.html/:slug",
      },
    ];
  },
};
