import { CATS } from "../economy/cats";

function Icon({ name }: { name: "huella" | "enojado" | "lata" }) {
  return <img className="icon" src={`/art/icons/${name}.png`} alt="" draggable={false} />;
}

export function PawMark() {
  return <Icon name="huella" />;
}

export function AngryCatFace() {
  return <Icon name="enojado" />;
}

export function CanIcon() {
  return <Icon name="lata" />;
}

export function CatSprite({ catId, pose = "sit", className }: { catId: string; pose?: "sit" | "sleep"; className?: string }) {
  const name = CATS.find((cat) => cat.id === catId)?.name ?? catId;
  return (
    <img
      className={`sprite${className ? ` ${className}` : ""}`}
      src={`/art/cats/${catId}-${pose}.png`}
      alt={name}
      data-testid={`cat-${catId}`}
      draggable={false}
    />
  );
}
