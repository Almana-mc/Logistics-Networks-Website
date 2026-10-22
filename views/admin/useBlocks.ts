import { useEffect, useState } from "react";
import { fetchBlocks, type Block } from "../../lib/admin";

export function useBlocks() {
  const [blocks, setRows] = useState<Block[] | null>(null);
  const [failed, setFailed] = useState(false);
  const setBlocks = (list: Block[]) => {
    setFailed(false);
    setRows(list);
  };
  useEffect(() => {
    fetchBlocks().then(setBlocks, () => setFailed(true));
  }, []);
  return { blocks, failed, setBlocks };
}
