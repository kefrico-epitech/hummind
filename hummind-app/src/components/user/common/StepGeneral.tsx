import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";

interface DepartmentStepGeneralProps {
  type: "organisation" | "departement" | "departement" | "salle";
  name: string;
  description: string;
  avatarUrl: string | null;
  errors: Record<string, string[]>;
  onChangeName: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onResetAvatar: () => void;
  onNext?: () => void;
}

export default function StepGeneral({
  type = "organisation",
  name,
  description,
  avatarUrl,
  errors,
  onChangeName,
  onChangeDescription,
  onResetAvatar,
  onNext,
}: DepartmentStepGeneralProps) {
  void avatarUrl;
  void onResetAvatar;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-semibold">Nom du {type}</label>
        <Input
          value={name}
          onChange={(event) => onChangeName(event.target.value)}
          className="h-11 rounded-xl border-0 bg-[#1F1F1F] text-sm placeholder:text-[#7C7C7C]"
          placeholder={`Entrez le nom de votre ${type}`}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">Description du {type}</label>
        <Textarea
          value={description}
          onChange={(event) => onChangeDescription(event.target.value)}
          rows={4}
          className="rounded-xl border-0 bg-[#1F1F1F] text-sm placeholder:text-[#7C7C7C]"
          placeholder={`Decrivez votre ${type}`}
        />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description[0]}</p>
        )}
      </div>

      {onNext && (
        <div className="pt-2">
          <Button
            type="button"
            className="h-11 w-full rounded-xl bg-[#3B3B3B] text-sm font-medium text-white hover:bg-[#4a4a4a]"
            onClick={onNext}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}
