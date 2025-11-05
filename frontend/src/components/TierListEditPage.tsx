import { useParams } from "react-router-dom";
import TierListEditor from "./TierListEditor";

export default function TierListEditPage() {
  const { id } = useParams();

  return (
    <div className="flex flex-col">
      <h1 className="text-2xl font-bold p-4">Editing Tier List #{id}</h1>
      <TierListEditor />
    </div>
  );
}
