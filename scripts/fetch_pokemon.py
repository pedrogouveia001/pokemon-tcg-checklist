import json
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
import os

def get_generation(pokemon_id):
    if 1 <= pokemon_id <= 151:
        return 1
    elif 152 <= pokemon_id <= 251:
        return 2
    elif 252 <= pokemon_id <= 386:
        return 3
    elif 387 <= pokemon_id <= 493:
        return 4
    elif 494 <= pokemon_id <= 649:
        return 5
    elif 650 <= pokemon_id <= 721:
        return 6
    elif 722 <= pokemon_id <= 809:
        return 7
    elif 810 <= pokemon_id <= 905:
        return 8
    elif 906 <= pokemon_id <= 1025:
        return 9
    return 9 # Default for new

def fetch_pokemon_details(pokemon_id):
    url = f"https://pokeapi.co/api/v2/pokemon/{pokemon_id}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            name = data['name'].capitalize()
            types = [t['type']['name'] for t in data['types']]
            # Keep types in English as it maps nicely, we will map/translate them in JS
            return {
                "id": pokemon_id,
                "name": name,
                "types": types,
                "generation": get_generation(pokemon_id)
            }
    except Exception as e:
        print(f"Error fetching Pokemon {pokemon_id}: {e}")
        return None

def main():
    print("Iniciando a busca de dados da PokeAPI...")
    pokemon_list = []
    
    # Fetch 1025 Pokémon (Gens 1-9)
    total_pokemon = 1025
    
    # Using ThreadPoolExecutor for fast concurrent fetching
    with ThreadPoolExecutor(max_workers=50) as executor:
        futures = {executor.submit(fetch_pokemon_details, i): i for i in range(1, total_pokemon + 1)}
        
        completed = 0
        for future in as_completed(futures):
            res = future.result()
            if res:
                pokemon_list.append(res)
            completed += 1
            if completed % 50 == 0 or completed == total_pokemon:
                print(f"Progresso: {completed}/{total_pokemon} Pokémon buscados...")
                
    # Sort by ID
    pokemon_list.sort(key=lambda x: x['id'])
    
    # Write to pokemonData.js
    output_dir = os.path.join(os.path.dirname(__file__), "..")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "pokemonData.js")
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("// Banco de dados estatico de Pokemon (1-1025) gerado automaticamente\n")
        f.write("const pokemonData = ")
        json.dump(pokemon_list, f, ensure_ascii=False, indent=2)
        f.write(";\n")
        
    print(f"Arquivo pokemonData.js gerado com sucesso em {output_path}!")

if __name__ == "__main__":
    main()
