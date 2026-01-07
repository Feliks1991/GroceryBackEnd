import path from "path";
import { dbPath } from "../utils/productPaths.mjs";
import { addRemoveToggle } from "../utils/addRemoveToggle.mjs";
import { queue } from "../utils/queue.mjs";
import { readJSON } from "../utils/RWservice.mjs";
import { readCategory } from "../utils/productsFilesService.mjs";
import { writeJSON } from "../utils/RWservice.mjs";

export const cartToggle = async (req, res, next) => {
  const { category, sku } = req.params;
  const { user } = req.auth;

  const userCartDir = path.join(dbPath, "products", "userSelectedProducts", `${user.id}`);
  const userCartFile = path.join(userCartDir, `${user.id}_cart.json`);
  await queue(async () => {
    try {
      const { productsCategoryData } = await readCategory(category);
      const settedProduct = productsCategoryData.find((product) => product.SKU === sku);
      await addRemoveToggle(userCartDir, userCartFile, sku, {
        ...settedProduct,
        quantity: 1,
        checked: true,
      });
    } catch (error) {
      throw error;
    }
  });
  res.status(200).json({ message: `${sku} was toggle` });
};

export const getCart = async (req, res, next) => {
  const { user, authorized } = req.auth;

  if (!authorized) {
    throw { status: 403, message: "Not authorized" };
  }

  const userCartFile = path.join(
    dbPath,
    "products",
    "userSelectedProducts",
    `${user.id}`,
    `${user.id}_cart.json`
  );
  const cartData = await readJSON(userCartFile);
  return res.status(200).json(cartData);
};

export const quantityChange = async (req, res, next) => {
  const { sku, quantity } = req.body;

  const { user } = req.auth;

  const userCartFile = path.join(
    dbPath,
    "products",
    "userSelectedProducts",
    `${user.id}`,
    `${user.id}_cart.json`
  );
  const cartData = structuredClone(await readJSON(userCartFile));

  cartData.forEach((item) => {
    if (item.SKU === sku) {
      item.quantity = quantity;
    }
  });

  await writeJSON(userCartFile, cartData);

  return res.status(200).json({ message: "quantity changed" });
};

export const checked = async (req, res, next) => {
  const { sku, checked } = req.body;

  const { user } = req.auth;

  const userCartFile = path.join(
    dbPath,
    "products",
    "userSelectedProducts",
    `${user.id}`,
    `${user.id}_cart.json`
  );
  const cartData = structuredClone(await readJSON(userCartFile));

  cartData.forEach((item) => {
    if (item.SKU === sku) {
      item.checked = checked;
    }
  });

  await writeJSON(userCartFile, cartData);

  return res.status(200).json({ message: checked ? "checked" : "unchecked" });
};

export const update = async (req, res, next) => {
  const { user } = req.auth;
  const data = req.body;

  const userCartFile = path.join(
    dbPath,
    "products",
    "userSelectedProducts",
    `${user.id}`,
    `${user.id}_cart.json`
  );

  const cartData = (await readJSON(userCartFile));

  for (const item of cartData) {
    const local = data[item.SKU];
    if (!local) continue;

    const { quantity, checked } = local;

    if (Number.isInteger(quantity) && quantity > 0 && typeof checked === "boolean") {
      item.checked = checked;
      item.quantity = quantity;
    }
  }

  await writeJSON(userCartFile, cartData);

  res.status(200).json({message: "Change complete"});
};

export const itemsDelete = async (req, res, next) => {
  const { user } = req.auth;

  const userCartFile = path.join(
    dbPath,
    "products",
    "userSelectedProducts",
    `${user.id}`,
    `${user.id}_cart.json`
  );

  const cartData = structuredClone(await readJSON(userCartFile));

  const result = cartData.filter((item) => !item.checked);

  await writeJSON(userCartFile, result);
  return res.status(200).json({ message: "Items was deleted" });
};
