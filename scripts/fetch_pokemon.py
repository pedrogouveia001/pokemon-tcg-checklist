"""
Regenera pokemonData.js (espécies 1-1025) a partir da PokéAPI / CSV oficial.

Uso:
  python scripts/fetch_pokemon.py
"""
import csv
import io
import json
import os
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

# Aliases em PT-BR para busca (PokéAPI não publica nomes pt-BR).
PT_ALIASES = {
    984: ["Presa Grande"],
    985: ["Cara de Pau"],
    986: ["Capuz de Tormenta"],
    987: ["Juba Voadora"],
    988: ["Rastejante"],
    989: ["Terracoleta"],
    1005: ["Serpente Emplumada"],
    1006: ["Andarilho do Alvorecer"],
    1009: ["Lagarta Enrodilhada"],
    1010: ["Folhas Férreas", "Folhas Ferreas"],
    1020: ["Chama Atroz"],
    1021: ["Raio Fúria", "Raio Furia"],
    1022: ["Rocha Férrea", "Rocha Ferrea"],
    1023: ["Coroa Férrea", "Coroa Ferrea"],
}


def get_generation(pokemon_id):
    if pokemon_id <= 151:
        return 1
    if pokemon_id <= 251:
        return 2
    if pokemon_id <= 386:
        return 3
    if pokemon_id <= 493:
        return 4
    if pokemon_id <= 649:
        return 5
    if pokemon_id <= 721:
        return 6
    if pokemon_id <= 809:
        return 7
    if pokemon_id <= 905:
        return 8
    return 9


def fetch_text(url):
    req = urllib.request.Request(url, headers={"User-Agent": "pokemon-tcg-checklist/1.0"})
    with urllib.request.urlopen(req, timeout=60) as response:
        return response.read().decode("utf-8")


def fetch_json(url):
    return json.loads(fetch_text(url))


def load_species_names():
    csv_text = fetch_text(
        "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_species_names.csv"
    )
    en, es = {}, {}
    reader = csv.DictReader(io.StringIO(csv_text))
    for row in reader:
        sid = int(row["pokemon_species_id"])
        lang = row["local_language_id"]
        if lang == "9":
            en[sid] = row["name"]
        elif lang == "7":
            es[sid] = row["name"]
    return en, es


def fetch_types(pokemon_id):
    data = fetch_json(f"https://pokeapi.co/api/v2/pokemon/{pokemon_id}")
    return [t["type"]["name"] for t in data["types"]]


def main():
    print("Carregando nomes oficiais (EN/ES)...")
    en_names, es_names = load_species_names()
    total = 1025
    if len(en_names) < total:
        raise SystemExit(f"CSV incompleto: {len(en_names)} nomes EN")

    print("Buscando tipos na PokéAPI...")
    types_by_id = {}
    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = {executor.submit(fetch_types, i): i for i in range(1, total + 1)}
        done = 0
        for future in as_completed(futures):
            pid = futures[future]
            types_by_id[pid] = future.result()
            done += 1
            if done % 50 == 0 or done == total:
                print(f"Progresso tipos: {done}/{total}")

    pokemon_list = []
    for i in range(1, total + 1):
        aliases = list(PT_ALIASES.get(i, []))
        es = es_names.get(i)
        if es and es != en_names[i] and es not in aliases:
            aliases.append(es)
        pokemon_list.append(
            {
                "id": i,
                "name": en_names[i],
                "aliases": aliases,
                "types": types_by_id[i],
                "generation": get_generation(i),
            }
        )

    output_path = os.path.join(os.path.dirname(__file__), "..", "pokemonData.js")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("// Banco de dados estático de Pokémon (1-1025) gerado automaticamente\n")
        f.write("const pokemonData = ")
        json.dump(pokemon_list, f, ensure_ascii=False, indent=2)
        f.write(";\n")

    print(f"Salvo {len(pokemon_list)} espécies em {output_path}")


if __name__ == "__main__":
    main()
