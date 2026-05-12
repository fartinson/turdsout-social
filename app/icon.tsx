import { createBrandIconResponse } from "@/lib/brand-icon";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default async function Icon() {
  return createBrandIconResponse(size.width);
}
