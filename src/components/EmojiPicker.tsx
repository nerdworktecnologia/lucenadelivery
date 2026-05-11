import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

type EmojiEntry = { emoji: string; tags: string[] };

const EMOJI_DATA: EmojiEntry[] = [
  // Food
  { emoji: "🍕", tags: ["pizza"] },
  { emoji: "🍔", tags: ["hamburguer", "burger", "lanche"] },
  { emoji: "🍟", tags: ["batata frita", "fritas"] },
  { emoji: "🌭", tags: ["cachorro quente", "hotdog"] },
  { emoji: "🍿", tags: ["pipoca"] },
  { emoji: "🧂", tags: ["sal", "tempero"] },
  { emoji: "🥓", tags: ["bacon"] },
  { emoji: "🥚", tags: ["ovo"] },
  { emoji: "🍳", tags: ["ovo frito", "frigideira"] },
  { emoji: "🧇", tags: ["waffle"] },
  { emoji: "🥞", tags: ["panqueca"] },
  { emoji: "🧈", tags: ["manteiga"] },
  { emoji: "🥐", tags: ["croissant", "pao"] },
  { emoji: "🍞", tags: ["pao", "pão"] },
  { emoji: "🥖", tags: ["baguete", "pao frances"] },
  { emoji: "🥨", tags: ["pretzel"] },
  { emoji: "🧀", tags: ["queijo"] },
  { emoji: "🥗", tags: ["salada"] },
  { emoji: "🥙", tags: ["wrap", "pita"] },
  { emoji: "🥪", tags: ["sanduiche", "lanche"] },
  { emoji: "🌮", tags: ["taco", "mexicano"] },
  { emoji: "🌯", tags: ["burrito", "wrap"] },
  { emoji: "🫔", tags: ["tamale"] },
  { emoji: "🥫", tags: ["lata", "conserva", "molho"] },
  { emoji: "🍝", tags: ["macarrao", "pasta", "espaguete"] },
  { emoji: "🍜", tags: ["ramen", "sopa", "noodle"] },
  { emoji: "🍲", tags: ["sopa", "caldo", "feijoada", "cozido"] },
  { emoji: "🍛", tags: ["curry", "prato", "refeicao", "quentinha"] },
  { emoji: "🍣", tags: ["sushi", "japones"] },
  { emoji: "🍱", tags: ["bento", "marmita", "quentinha", "refeicao"] },
  { emoji: "🥟", tags: ["dumpling", "pastel", "gyoza"] },
  { emoji: "🦪", tags: ["ostra", "marisco"] },
  { emoji: "🍤", tags: ["camarao"] },
  { emoji: "🍙", tags: ["onigiri", "arroz"] },
  { emoji: "🍚", tags: ["arroz"] },
  { emoji: "🍘", tags: ["biscoito arroz"] },
  { emoji: "🍥", tags: ["naruto", "peixe"] },
  { emoji: "🥠", tags: ["biscoito sorte"] },
  { emoji: "🥮", tags: ["bolo lua"] },
  { emoji: "🍢", tags: ["espeto", "churrasco"] },
  { emoji: "🍡", tags: ["dango", "doce"] },
  // Desserts
  { emoji: "🍧", tags: ["sorvete", "raspadinha", "acai"] },
  { emoji: "🍨", tags: ["sorvete", "sundae"] },
  { emoji: "🍦", tags: ["sorvete", "casquinha"] },
  { emoji: "🥧", tags: ["torta"] },
  { emoji: "🧁", tags: ["cupcake", "bolo"] },
  { emoji: "🍰", tags: ["bolo", "fatia", "torta"] },
  { emoji: "🎂", tags: ["bolo", "aniversario"] },
  { emoji: "🍮", tags: ["pudim", "flan", "sobremesa"] },
  { emoji: "🍭", tags: ["pirulito", "doce"] },
  { emoji: "🍬", tags: ["bala", "doce"] },
  { emoji: "🍫", tags: ["chocolate"] },
  { emoji: "🍩", tags: ["donut", "rosquinha"] },
  { emoji: "🍪", tags: ["biscoito", "cookie"] },
  { emoji: "🌰", tags: ["castanha"] },
  { emoji: "🥜", tags: ["amendoim"] },
  { emoji: "🫘", tags: ["feijao"] },
  { emoji: "🍯", tags: ["mel"] },
  // Drinks
  { emoji: "🥛", tags: ["leite"] },
  { emoji: "🍼", tags: ["mamadeira", "leite"] },
  { emoji: "🫖", tags: ["cha", "bule"] },
  { emoji: "☕", tags: ["cafe", "café"] },
  { emoji: "🍵", tags: ["cha", "chá"] },
  { emoji: "🧃", tags: ["suco", "juice"] },
  { emoji: "🥤", tags: ["refrigerante", "suco", "bebida"] },
  { emoji: "🧋", tags: ["bubble tea", "cha"] },
  { emoji: "🍶", tags: ["sake"] },
  { emoji: "🍺", tags: ["cerveja"] },
  { emoji: "🍻", tags: ["cerveja", "brinde"] },
  { emoji: "🥂", tags: ["champagne", "espumante", "brinde"] },
  { emoji: "🍷", tags: ["vinho"] },
  { emoji: "🥃", tags: ["whisky", "drink"] },
  { emoji: "🍸", tags: ["cocktail", "drink", "martini"] },
  { emoji: "🍹", tags: ["drink", "tropical", "caipirinha"] },
  { emoji: "🧊", tags: ["gelo"] },
  { emoji: "🫗", tags: ["agua", "líquido"] },
  { emoji: "🥡", tags: ["caixa", "delivery", "comida chinesa"] },
  { emoji: "🫙", tags: ["pote", "conserva"] },
  // Animals / ingredients
  { emoji: "🐔", tags: ["frango", "galinha"] },
  { emoji: "🐷", tags: ["porco", "suino"] },
  { emoji: "🐮", tags: ["boi", "carne", "vaca"] },
  { emoji: "🐟", tags: ["peixe"] },
  { emoji: "🐙", tags: ["polvo"] },
  { emoji: "🦐", tags: ["camarao"] },
  { emoji: "🦞", tags: ["lagosta"] },
  { emoji: "🦀", tags: ["caranguejo", "siri"] },
  { emoji: "🐑", tags: ["cordeiro", "ovelha"] },
  // Vegetables
  { emoji: "🌶️", tags: ["pimenta", "picante"] },
  { emoji: "🫑", tags: ["pimentao"] },
  { emoji: "🥕", tags: ["cenoura"] },
  { emoji: "🧄", tags: ["alho"] },
  { emoji: "🧅", tags: ["cebola"] },
  { emoji: "🥔", tags: ["batata"] },
  { emoji: "🍠", tags: ["batata doce"] },
  { emoji: "🥦", tags: ["brocolis"] },
  { emoji: "🥬", tags: ["alface", "couve", "verdura"] },
  { emoji: "🥒", tags: ["pepino"] },
  { emoji: "🍅", tags: ["tomate"] },
  { emoji: "🍆", tags: ["berinjela"] },
  { emoji: "🌽", tags: ["milho"] },
  { emoji: "🥑", tags: ["abacate"] },
  { emoji: "🫒", tags: ["azeitona"] },
  // Fruits
  { emoji: "🍇", tags: ["uva"] },
  { emoji: "🍈", tags: ["melao"] },
  { emoji: "🍉", tags: ["melancia"] },
  { emoji: "🍊", tags: ["laranja", "tangerina"] },
  { emoji: "🍋", tags: ["limao"] },
  { emoji: "🍌", tags: ["banana"] },
  { emoji: "🍍", tags: ["abacaxi"] },
  { emoji: "🥭", tags: ["manga"] },
  { emoji: "🍎", tags: ["maca", "maçã"] },
  { emoji: "🍏", tags: ["maca verde"] },
  { emoji: "🍐", tags: ["pera"] },
  { emoji: "🍑", tags: ["pessego"] },
  { emoji: "🍒", tags: ["cereja"] },
  { emoji: "🍓", tags: ["morango"] },
  { emoji: "🫐", tags: ["mirtilo", "blueberry"] },
  { emoji: "🥝", tags: ["kiwi"] },
  // Objects & symbols
  { emoji: "🍽️", tags: ["prato", "talheres", "refeicao", "restaurante"] },
  { emoji: "🥢", tags: ["hashi", "pauzinho"] },
  { emoji: "🔪", tags: ["faca", "cozinha"] },
  { emoji: "🏪", tags: ["loja", "mercado", "conveniencia"] },
  { emoji: "🏠", tags: ["casa", "home"] },
  { emoji: "⭐", tags: ["estrela", "destaque", "favorito"] },
  { emoji: "❤️", tags: ["coracao", "favorito", "amor"] },
  { emoji: "🔥", tags: ["fogo", "quente", "popular", "picante"] },
  { emoji: "✨", tags: ["brilho", "novo", "especial"] },
  { emoji: "💰", tags: ["dinheiro", "preco", "promocao"] },
  { emoji: "🎉", tags: ["festa", "celebracao"] },
  { emoji: "🎊", tags: ["festa", "confete"] },
  { emoji: "🛒", tags: ["carrinho", "compras"] },
  { emoji: "📦", tags: ["caixa", "pacote", "delivery"] },
  { emoji: "🎁", tags: ["presente", "brinde"] },
  { emoji: "🏷️", tags: ["etiqueta", "preco", "oferta"] },
  { emoji: "💳", tags: ["cartao", "pagamento"] },
  { emoji: "🧾", tags: ["recibo", "nota", "conta"] },
  { emoji: "📋", tags: ["lista", "cardapio", "menu"] },
  { emoji: "⏰", tags: ["relogio", "horario", "tempo"] },
];

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? EMOJI_DATA.filter((e) =>
        e.tags.some((t) => t.includes(search.toLowerCase()))
      )
    : EMOJI_DATA;

  const select = (emoji: string) => {
    onChange(emoji);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full h-10 px-3 rounded-md border border-input bg-background text-left text-2xl hover:bg-accent/50 transition-colors cursor-pointer flex items-center"
        >
          {value || "🍽️"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <Input
          placeholder="Buscar: pizza, frango, bebida..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2 h-8 text-sm"
          autoFocus
        />
        <ScrollArea className="h-48">
          {filtered.length > 0 ? (
            <div className="grid grid-cols-8 gap-1">
              {filtered.map((e) => (
                <button
                  key={e.emoji}
                  type="button"
                  onClick={() => select(e.emoji)}
                  title={e.tags.join(", ")}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-accent text-lg cursor-pointer transition-colors"
                >
                  {e.emoji}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-6">Nenhum emoji encontrado</p>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
