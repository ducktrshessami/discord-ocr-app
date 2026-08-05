import { Component } from "../utils/components.js";
import { collateHandlers } from "../utils/interactions.js";

const components = await collateHandlers<Component>(import.meta.url);
export default components;
