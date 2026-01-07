import fs from "fs/promises";

export const readJSON = async (file) => {
  const fileContent = await fs.readFile(file, "utf-8");  
  return JSON.parse(fileContent);
};
export const writeJSON = async (file, data) => {
  await fs.writeFile(file, JSON.stringify(data, null, 2));
};
