import { ImageObject } from "./ImageObject";
const fs = require("fs");
const path = require("path");

module.exports = function getAllFilesAsObject(
  basePath: string,
  dirPath: string,
  exportFolderName: string,
  arrayOfFiles: ImageObject[] = []
) {
  // check if the path is existing
  if (fs.existsSync(dirPath)) {
    let files = fs.readdirSync(dirPath);

    files.forEach(function (file: string) {
      const fullPath = path.join(dirPath, file);
      if (fs.statSync(fullPath).isDirectory()) {
        // Exclude the legacy default folder name "nextImageExportOptimizer"
        // The new export folder (e.g., "public/export") is assumed to be
        // outside the image folder, so no need to check for it
        if (file !== "nextImageExportOptimizer") {
          arrayOfFiles = getAllFilesAsObject(
            basePath,
            fullPath,
            exportFolderName,
            arrayOfFiles
          );
        }
      } else {
        const dirPathWithoutBasePath = dirPath
          .replace(basePath, "") // remove the basePath for later path composition
          .replace(/^(\/)/, ""); // remove the first trailing slash if there is one at the first position
        arrayOfFiles.push({ basePath, dirPathWithoutBasePath, file });
      }
    });
  }

  return arrayOfFiles;
};
