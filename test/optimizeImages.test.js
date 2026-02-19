/* eslint-disable no-undef */
const assert = require("assert");
const fs = require("fs");
const execSync = require("child_process").execSync;
const sharp = require("sharp");

const deleteFolder = (folderName) => {
  if (fs.existsSync(folderName)) {
    fs.rmSync(folderName, {
      recursive: true,
      force: false,
    });
  }
  assert(!fs.existsSync(folderName));
};

const filterForImages = (file) => {
  let extension = file.split(".").pop().toUpperCase();
  // Stop if the file is not an image
  return ["JPG", "JPEG", "WEBP", "PNG", "GIF", "AVIF"].includes(extension);
};
const getFiles = (dirPath) =>
  fs.existsSync(dirPath) ? fs.readdirSync(dirPath).filter(f => {
    // Filter out directories
    const fullPath = require("path").join(dirPath, f);
    return fs.statSync(fullPath).isFile();
  }) : [];

const legacyConfig = `module.exports = {
  images: {
    loader: "custom",
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    deviceSizes: [640, 750, 777, 828, 1080, 1200, 1920, 2048, 3840],
  },
  output: "export",
  transpilePackages: ["next-image-export-optimizer"],
  env: {
    storePicturesInWEBP: "false",
    generateAndUseBlurImages: "true",
    nextImageExportOptimizer_outputFolderPath: "public/output",
  },
};
`;
const newConfig = `module.exports = {
  images: {
    loader: "custom",
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    deviceSizes: [640, 750, 777, 828, 1080, 1200, 1920, 2048, 3840],
  },
  output: "export",
  transpilePackages: ["next-image-export-optimizer"],
  env: {
    nextImageExportOptimizer_imageFolderPath: "public/images",
    nextImageExportOptimizer_exportFolderPath: "out",
    nextImageExportOptimizer_outputFolderPath: "public/output",
    nextImageExportOptimizer_quality: "75",
    nextImageExportOptimizer_storePicturesInWEBP: "true",
    nextImageExportOptimizer_generateAndUseBlurImages: "true",
    nextImageExportOptimizer_remoteImageCacheTTL: "0",
  },
};
`;
const newConfigJpeg = `module.exports = {
  images: {
    loader: "custom",
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    deviceSizes: [640, 750, 777, 828, 1080, 1200, 1920, 2048, 3840],
  },
  output: "export",
  transpilePackages: ["next-image-export-optimizer"],
  env: {
    nextImageExportOptimizer_imageFolderPath: "public/images",
    nextImageExportOptimizer_exportFolderPath: "out",
    nextImageExportOptimizer_outputFolderPath: "public/output",
    nextImageExportOptimizer_quality: "75",
    nextImageExportOptimizer_storePicturesInWEBP: "false",
    nextImageExportOptimizer_generateAndUseBlurImages: "true",
    nextImageExportOptimizer_remoteImageCacheTTL: "0",
  },
};
`;
const newConfigExportFolderName = `module.exports = {
  images: {
    loader: "custom",
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    deviceSizes: [640, 750, 777, 828, 1080, 1200, 1920, 2048, 3840],
  },
  output: "export",
  transpilePackages: ["next-image-export-optimizer"],
  env: {
    nextImageExportOptimizer_imageFolderPath: "public/images",
    nextImageExportOptimizer_exportFolderPath: "out",
    nextImageExportOptimizer_quality: "75",
    nextImageExportOptimizer_storePicturesInWEBP: "false",
    nextImageExportOptimizer_generateAndUseBlurImages: "true",
    nextImageExportOptimizer_outputFolderPath: "public/output2",
  },
};
`;

const newConfigBasePath = `module.exports = {
  basePath: "/subsite",
  images: {
    loader: "custom",
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    deviceSizes: [640, 750, 777, 828, 1080, 1200, 1920, 2048, 3840],
  },
  transpilePackages: ["next-image-export-optimizer"],
  env: {
    nextImageExportOptimizer_imageFolderPath: "public/images",
    nextImageExportOptimizer_exportFolderPath: "out",
    nextImageExportOptimizer_outputFolderPath: "public/output",
    nextImageExportOptimizer_quality: "75",
    nextImageExportOptimizer_storePicturesInWEBP: "true",
    nextImageExportOptimizer_generateAndUseBlurImages: "true",
    nextImageExportOptimizer_remoteImageCacheTTL: "0",
  },
};
`;

async function testConfig(config) {
  // Clean up export folders (new structure: public/nextImageExportOptimizer/)
  deleteFolder("example/public/nextImageExportOptimizer");
  deleteFolder("example/public/nextImageExportOptimizer2");

  // write config file for the to be tested configuration variables to the folder
  fs.writeFileSync("example/next.config.ts", config);

  // Clean up build output folders
  deleteFolder("example/out/nextImageExportOptimizer");
  deleteFolder("example/out/nextImageExportOptimizer2");

  execSync(
    "npm run build && cd example/ && npm run export && node ../dist/optimizeImages.js"
  );

  // New structure: all images in {exportFolderName}/ with subdirectory structure preserved
  // Root level images (from public/images/)
  const allFilesInImageFolder = getFiles(
    "example/public/nextImageExportOptimizer"
  );
  const allImagesInImageFolder = allFilesInImageFolder.filter(filterForImages);

  // Static images (from .next/static/media/) go to {exportFolderName}/_next/static/media/
  const allFilesInStaticImageFolder = getFiles(
    "example/public/nextImageExportOptimizer/_next/static/media"
  );
  const allImagesInStaticImageFolder =
    allFilesInStaticImageFolder.filter(filterForImages);

  // Remote images go to {exportFolderName}/remoteImages/
  const allFilesInRemoteImageFolder = getFiles(
    "example/public/nextImageExportOptimizer/remoteImages"
  );
  const allImagesInRemoteImageFolder =
    allFilesInRemoteImageFolder.filter(filterForImages);

  // Subfolder images go to {exportFolderName}/subfolder/
  const allFilesInImageSubFolder = getFiles(
    "example/public/nextImageExportOptimizer/subfolder"
  );
  const allImagesInImageSubFolder =
    allFilesInImageSubFolder.filter(filterForImages);

  // Build output folders
  const allFilesInImageBuildFolder = getFiles(
    "example/out/nextImageExportOptimizer"
  );
  const allFilesInStaticImageBuildFolder = getFiles(
    "example/out/nextImageExportOptimizer/_next/static/media"
  );

  const allFilesInImageBuildSubFolder = getFiles(
    "example/out/nextImageExportOptimizer/subfolder"
  );

  // For custom export folder name (nextImageExportOptimizer2)
  const allFilesInImageFolderCustomExportFolder = getFiles(
    "example/public/nextImageExportOptimizer2"
  );

  const allImagesInImageFolderCustomExportFolder =
    allFilesInImageFolderCustomExportFolder.filter(filterForImages);
  const allFilesInStaticImageFolderCustomExportFolder = getFiles(
    "example/public/nextImageExportOptimizer2/_next/static/media"
  );

  const allImagesInStaticImageFolderCustomExportFolder =
    allFilesInStaticImageFolderCustomExportFolder.filter(filterForImages);

  // Remote images for custom export folder
  const allFilesInRemoteImageFolderCustomExportFolder = getFiles(
    "example/public/nextImageExportOptimizer2/remoteImages"
  );
  const allImagesInRemoteImageFolderCustomExportFolder =
    allFilesInRemoteImageFolderCustomExportFolder.filter(filterForImages);

  const allFilesInImageSubFolderCustomExportFolder = getFiles(
    "example/public/nextImageExportOptimizer2/subfolder"
  );

  const allImagesInImageSubFolderCustomExportFolder =
    allFilesInImageSubFolderCustomExportFolder.filter(filterForImages);

  const allFilesInImageBuildFolderCustomExportFolder = getFiles(
    "example/out/nextImageExportOptimizer2"
  );

  const allFilesInStaticImageBuildFolderCustomExportFolder = getFiles(
    "example/out/nextImageExportOptimizer2/_next/static/media"
  );

  const allFilesInImageBuildSubFolderCustomExportFolder = getFiles(
    "example/out/nextImageExportOptimizer2/subfolder"
  );

  if (
    config === newConfig ||
    config === legacyConfig ||
    config === newConfigBasePath
  ) {
    expect(allImagesInImageFolder).toMatchSnapshot();
    expect(allImagesInStaticImageFolder).toMatchSnapshot();
    expect(allImagesInRemoteImageFolder).toMatchSnapshot();
    expect(allImagesInImageSubFolder).toMatchSnapshot();
    expect(allFilesInImageBuildFolder).toMatchSnapshot();
    expect(allFilesInStaticImageFolder).toMatchSnapshot();
    expect(allFilesInImageBuildSubFolder).toMatchSnapshot();
  } else if (config === newConfigExportFolderName) {
    expect(allImagesInImageFolderCustomExportFolder).toMatchSnapshot();
    expect(allImagesInStaticImageFolderCustomExportFolder).toMatchSnapshot();
    expect(allImagesInRemoteImageFolderCustomExportFolder).toMatchSnapshot();
    expect(allImagesInImageSubFolderCustomExportFolder).toMatchSnapshot();
    expect(allFilesInImageBuildFolderCustomExportFolder).toMatchSnapshot();
    expect(
      allFilesInStaticImageBuildFolderCustomExportFolder
    ).toMatchSnapshot();
    expect(allFilesInImageBuildSubFolderCustomExportFolder).toMatchSnapshot();
  } else {
    expect(allImagesInImageFolder).toMatchSnapshot();
    expect(allImagesInStaticImageFolder).toMatchSnapshot();
    expect(allImagesInRemoteImageFolder).toMatchSnapshot();
    expect(allImagesInImageSubFolder).toMatchSnapshot();
    expect(allFilesInImageBuildFolder).toMatchSnapshot();
    expect(allFilesInStaticImageBuildFolder).toMatchSnapshot();
    expect(allFilesInImageBuildSubFolder).toMatchSnapshot();
  }

  const imageFolders = [
    {
      basePath: "example/public/nextImageExportOptimizer",
      imageFileArray: allImagesInImageFolder,
    },
    {
      basePath: "example/public/nextImageExportOptimizer/subfolder",
      imageFileArray: allImagesInImageSubFolder,
    },
    {
      basePath: "example/public/nextImageExportOptimizer/_next/static/media",
      imageFileArray: allImagesInStaticImageFolder,
    },
    {
      basePath: "example/public/nextImageExportOptimizer/remoteImages",
      imageFileArray: allImagesInRemoteImageFolder,
    },
    {
      basePath: "example/public/nextImageExportOptimizer2",
      imageFileArray: allImagesInImageFolderCustomExportFolder,
    },
    {
      basePath: "example/public/nextImageExportOptimizer2/subfolder",
      imageFileArray: allImagesInImageSubFolderCustomExportFolder,
    },
    {
      basePath: "example/public/nextImageExportOptimizer2/_next/static/media",
      imageFileArray: allImagesInStaticImageFolderCustomExportFolder,
    },
    {
      basePath: "example/public/nextImageExportOptimizer2/remoteImages",
      imageFileArray: allImagesInRemoteImageFolderCustomExportFolder,
    },
  ];
  for (let index = 0; index < imageFolders.length; index++) {
    const imageFolderBasePath = imageFolders[index].basePath;
    const imageFileArray = imageFolders[index].imageFileArray;

    const imageFileStats = [];
    for (let index = 0; index < imageFileArray.length; index++) {
      const imageFile = imageFileArray[index];
      const image = await sharp(`${imageFolderBasePath}/${imageFile}`);
      const metadata = await image.metadata();
      const statsToBeChecked = [
        metadata.format,
        metadata.width,
        metadata.height,
      ];
      imageFileStats.push(statsToBeChecked);
    }
    if (
      config === newConfig ||
      config === legacyConfig ||
      config === newConfigBasePath
    ) {
      // Check metadata for root (0), subfolder (1), static (2), and remote (3) images
      if (index <= 3) {
        expect(imageFileStats).toMatchSnapshot();
      }
    }
    if (config === newConfigJpeg) {
      // Check metadata for root (0), subfolder (1), static (2), and remote (3) images
      if (index <= 3) {
        expect(imageFileStats).toMatchSnapshot();
      }
    }
  }
}

jest.setTimeout(180000);
test("legacyConfig", async () => {
  console.log("Running legacyConfig test...");
  await testConfig(legacyConfig);
  console.log("legacyConfig test finished.");
});

test("newConfigJpeg", async () => {
  console.log("Running newConfigJpeg test...");
  await testConfig(newConfigJpeg);
  console.log("newConfigJpeg test finished.");
});

test("newConfigExportFolderName", async () => {
  console.log("Running newConfigExportFolderName test...");
  await testConfig(newConfigExportFolderName);
  console.log("newConfigExportFolderName test finished.");
});

test("newConfigBasePath", async () => {
  console.log("Running newConfigBasePath test...");
  await testConfig(newConfigBasePath);
  console.log("newConfigBasePath test finished.");
});

test("newConfig", async () => {
  console.log("Running newConfig test...");
  await testConfig(newConfig);
  console.log("newConfig test finished.");
});
