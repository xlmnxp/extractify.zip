let selectedItem = ref("/")
export const useSelectedItem = () => useState("selected-item", () => selectedItem)