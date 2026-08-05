import { collateHandlers } from "../utils/interactions.js";
import { Modal } from "../utils/modals.js";

const modals = await collateHandlers<Modal>(import.meta.url);
export default modals;
