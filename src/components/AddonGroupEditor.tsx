import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, GripVertical } from "lucide-react";

export interface AddonOption {
  name: string;
  price: number;
}

export interface AddonGroup {
  group: string;
  maxSelect: number;
  required: boolean;
  options: AddonOption[];
}

interface Props {
  groups: AddonGroup[];
  onChange: (groups: AddonGroup[]) => void;
}

const emptyGroup: AddonGroup = { group: "", maxSelect: 1, required: false, options: [{ name: "", price: 0 }] };

const AddonGroupEditor = ({ groups, onChange }: Props) => {
  const addGroup = () => onChange([...groups, { ...emptyGroup, options: [{ name: "", price: 0 }] }]);

  const updateGroup = (i: number, patch: Partial<AddonGroup>) =>
    onChange(groups.map((g, idx) => (idx === i ? { ...g, ...patch } : g)));

  const removeGroup = (i: number) => onChange(groups.filter((_, idx) => idx !== i));

  const addOption = (gi: number) =>
    updateGroup(gi, { options: [...groups[gi].options, { name: "", price: 0 }] });

  const updateOption = (gi: number, oi: number, patch: Partial<AddonOption>) =>
    updateGroup(gi, {
      options: groups[gi].options.map((o, idx) => (idx === oi ? { ...o, ...patch } : o)),
    });

  const removeOption = (gi: number, oi: number) =>
    updateGroup(gi, { options: groups[gi].options.filter((_, idx) => idx !== oi) });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Grupos de Adicionais</Label>
        <Button type="button" size="sm" variant="outline" className="gap-1 text-xs" onClick={addGroup}>
          <Plus className="h-3 w-3" /> Grupo
        </Button>
      </div>

      {groups.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-3">
          Nenhum grupo de adicionais. Clique em "+ Grupo" para começar.
        </p>
      )}

      {groups.map((g, gi) => (
        <Card key={gi} className="border-dashed">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Nome do grupo (ex: Acompanhamentos)"
                value={g.group}
                onChange={(e) => updateGroup(gi, { group: e.target.value })}
                className="text-sm font-medium"
              />
              <Button type="button" size="icon" variant="ghost" onClick={() => removeGroup(gi)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>

            <div className="flex items-center gap-4 pl-6">
              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap">Máx. seleções</Label>
                <Input
                  type="number"
                  min={1}
                  value={g.maxSelect}
                  onChange={(e) => updateGroup(gi, { maxSelect: Number(e.target.value) || 1 })}
                  className="w-16 h-7 text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={g.required}
                  onCheckedChange={(v) => updateGroup(gi, { required: v })}
                  className="scale-75"
                />
                <Label className="text-xs">Obrigatório</Label>
              </div>
            </div>

            <div className="pl-6 space-y-1">
              {g.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <Input
                    placeholder="Nome da opção"
                    value={opt.name}
                    onChange={(e) => updateOption(gi, oi, { name: e.target.value })}
                    className="flex-1 h-7 text-xs"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={opt.price}
                      onChange={(e) => updateOption(gi, oi, { price: Number(e.target.value) || 0 })}
                      className="w-20 h-7 text-xs"
                    />
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => removeOption(gi, oi)}
                    disabled={g.options.length <= 1}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button type="button" size="sm" variant="ghost" className="gap-1 text-xs h-7" onClick={() => addOption(gi)}>
                <Plus className="h-3 w-3" /> Opção
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AddonGroupEditor;
