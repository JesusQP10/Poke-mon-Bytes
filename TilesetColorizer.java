import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class TilesetColorizer {

    private static final String SRC = "c:/Users/jesus/OneDrive/Documentos/Escritorio/Pokémon Bytes/JesusQP10 pokegold master gfx-tilesets";
    private static final String DST_INT = "c:/Users/jesus/OneDrive/Documentos/Escritorio/Pokémon Bytes/pokemon-frontend/public/assets/game/overworld/tiles/sheets/interiors";
    private static final String DST_EXT = "c:/Users/jesus/OneDrive/Documentos/Escritorio/Pokémon Bytes/pokemon-frontend/public/assets/game/overworld/tiles/sheets/overworld";

    // Valores de gris → índice de color en la paleta
    // 255 (blanco)   → color 0 (más claro)
    // 170            → color 1
    //  85            → color 2
    //   0 (negro)    → color 3 (más oscuro)
    private static final Map<Integer, Integer> GRIS_A_IDX = new HashMap<>();
    static {
        GRIS_A_IDX.put(255, 0);
        GRIS_A_IDX.put(170, 1);
        GRIS_A_IDX.put(85, 2);
        GRIS_A_IDX.put(0, 3);
    }

    // ── 1. Parsear bg_tiles.pal ───────────────────────────────────────────────────
    // Formato: RGB r0,g0,b0, r1,g1,b1, r2,g2,b2, r3,g3,b3 ; nombre_color
    // Valores GBC: 0-31 → multiplicar ×8 para obtener 0-255
    private Map<String, Map<String, List<int[]>>> parsearPaleta(String ruta) throws IOException {
        Map<String, Map<String, List<int[]>>> paletas = new HashMap<>(); // { "day": { "gray": [(r,g,b), ...×4], ... }, ... }
        String tod = null;
        Pattern pattern = Pattern.compile("RGB\\s+([\\d,\\s]+);\\s*(\\w+)");

        try (BufferedReader reader = new BufferedReader(new FileReader(ruta))) {
            String linea;
            while ((linea = reader.readLine()) != null) {
                String s = linea.trim();
                if (s.startsWith("; ")) {
                    tod = s.substring(2).trim().toLowerCase();
                    paletas.putIfAbsent(tod, new HashMap<>());
                } else if (s.startsWith("RGB") && tod != null) {
                    Matcher m = pattern.matcher(s);
                    if (m.find()) {
                        String[] numsStr = m.group(1).trim().split(",");
                        int[] nums = new int[numsStr.length];
                        for (int i = 0; i < numsStr.length; i++) {
                            nums[i] = Integer.parseInt(numsStr[i].trim());
                        }
                        String nombre = m.group(2).toLowerCase();
                        List<int[]> colores = new ArrayList<>();
                        for (int i = 0; i < 4; i++) {
                            colores.add(new int[]{nums[i * 3] * 8, nums[i * 3 + 1] * 8, nums[i * 3 + 2] * 8});
                        }
                        paletas.get(tod).put(nombre, colores);
                    }
                }
            }
        }
        return paletas;
    }

    // ── 2. Parsear *_palette_map.asm ──────────────────────────────────────────────
    // Formato: \ttilepal 0, PAL, PAL, ..., PAL  (8 paletas por línea)
    private List<String> parsearMapaPaleta(String ruta) throws IOException {
        List<String> tiles = new ArrayList<>();
        Pattern pattern = Pattern.compile("\\s*tilepal\\s+\\d+,\\s*(.*)");

        try (BufferedReader reader = new BufferedReader(new FileReader(ruta))) {
            String linea;
            while ((linea = reader.readLine()) != null) {
                Matcher m = pattern.matcher(linea);
                if (m.find()) {
                    String[] nombres = m.group(1).split(",");
                    for (String nombre : nombres) {
                        tiles.add(nombre.trim().toLowerCase());
                    }
                }
            }
        }
        return tiles;
    }

    // ── 3. Colorizar tileset ──────────────────────────────────────────────────────
    private BufferedImage colorizar(String rutaPng, String rutaPalMap, Map<String, List<int[]>> setPaleta, int escala) throws IOException {
        BufferedImage img = ImageIO.read(new File(rutaPng));
        int H = img.getHeight();
        int W = img.getWidth();
        int tilesX = W / 8;

        List<String> mapa = parsearMapaPaleta(rutaPalMap);

        BufferedImage resultado = new BufferedImage(W, H, BufferedImage.TYPE_INT_ARGB);

        for (int idx = 0; idx < mapa.size(); idx++) {
            String nombrePal = mapa.get(idx);
            int tx = (idx % tilesX) * 8;
            int ty = (idx / tilesX) * 8;
            if (ty + 8 > H) {
                break;
            }

            List<int[]> colores = setPaleta.get(nombrePal);
            if (colores == null) {
                colores = setPaleta.get("gray");
            }
            if (colores == null) {
                continue; // No se encontró paleta, saltar
            }

            for (int py = 0; py < 8; py++) {
                for (int px = 0; px < 8; px++) {
                    // Obtener el valor de gris del píxel 
                    int pixel = img.getRGB(tx + px, ty + py);
                    int grayValue = (pixel >> 16) & 0xFF; // Red component

                    Integer cidx = GRIS_A_IDX.get(grayValue);
                    if (cidx == null) {
                        cidx = 3; // Default to darkest if not found
                    }

                    int[] rgb = colores.get(cidx);
                    int r = rgb[0];
                    int g = rgb[1];
                    int b = rgb[2];

                    // Color 0 → transparente para permitir capas
                    int a = (cidx == 0) ? 0 : 255;

                    int argb = (a << 24) | (r << 16) | (g << 8) | b;
                    resultado.setRGB(tx + px, ty + py, argb);
                }
            }
        }

        if (escala != 1) {
            BufferedImage scaledImage = new BufferedImage(W * escala, H * escala, BufferedImage.TYPE_INT_ARGB);
            java.awt.Graphics2D graphics = scaledImage.createGraphics();
            graphics.drawImage(resultado, 0, 0, W * escala, H * escala, null);
            graphics.dispose();
            resultado = scaledImage;
        }
        return resultado;
    }

    // ── 4. Lista de tilesets a procesar ──────────────────────────────────────────
    private record TilesetConfig(String png, String palMap, String tod, String destino, String nombreSalida) {}

    private static final List<TilesetConfig> TILESETS = Arrays.asList(
            // Interiores
            new TilesetConfig("players_room.png", "players_room_palette_map.asm", "indoor", DST_INT, "players_room.png"),
            new TilesetConfig("players_house.png", "players_house_palette_map.asm", "indoor", DST_INT, "players_house.png"),
            new TilesetConfig("house.png", "house_palette_map.asm", "indoor", DST_INT, "house.png"),
            new TilesetConfig("lab.png", "lab_palette_map.asm", "indoor", DST_INT, "lab.png"),
            new TilesetConfig("pokecenter.png", "pokecenter_palette_map.asm", "indoor", DST_INT, "pokecenter.png"),
            new TilesetConfig("mart.png", "mart_palette_map.asm", "indoor", DST_INT, "mart.png"),
            new TilesetConfig("traditional_house.png", "traditional_house_palette_map.asm", "indoor", DST_INT, "traditional_house.png"),
            new TilesetConfig("gate.png", "gate_palette_map.asm", "indoor", DST_INT, "gate.png"),
            new TilesetConfig("game_corner.png", "game_corner_palette_map.asm", "indoor", DST_INT, "game_corner.png"),
            new TilesetConfig("underground.png", "underground_palette_map.asm", "indoor", DST_INT, "underground.png"),
            new TilesetConfig("tower.png", "tower_palette_map.asm", "indoor", DST_INT, "tower.png"),
            new TilesetConfig("lighthouse.png", "lighthouse_palette_map.asm", "indoor", DST_INT, "lighthouse.png"),
            new TilesetConfig("radio_tower.png", "radio_tower_palette_map.asm", "indoor", DST_INT, "radio_tower.png"),
            // Exteriores
            new TilesetConfig("johto.png", "johto_palette_map.asm", "day", DST_EXT, "johto.png"),
            new TilesetConfig("johto_modern.png", "johto_modern_palette_map.asm", "day", DST_EXT, "johto_modern.png"),
            new TilesetConfig("kanto.png", "kanto_palette_map.asm", "day", DST_EXT, "kanto.png"),
            new TilesetConfig("forest.png", "forest_palette_map.asm", "day", DST_EXT, "forest.png"),
            new TilesetConfig("cave.png", "cave_palette_map.asm", "nite", DST_EXT, "cave.png"),
            new TilesetConfig("park.png", "park_palette_map.asm", "day", DST_EXT, "park.png"),
            new TilesetConfig("port.png", "port_palette_map.asm", "day", DST_EXT, "port.png"),
            new TilesetConfig("ruins_of_alph.png", "ruins_of_alph_palette_map.asm", "day", DST_EXT, "ruins_of_alph.png"),
            new TilesetConfig("mansion.png", "mansion_palette_map.asm", "nite", DST_EXT, "mansion.png"),
            new TilesetConfig("ice_path.png", "ice_path_palette_map.asm", "nite", DST_EXT, "ice_path.png")
    );

    // ── 5. Ejecutar ───────────────────────────────────────────────────────────────
    public static void main(String[] args) {
        TilesetColorizer colorizer = new TilesetColorizer();

        try {
            Files.createDirectories(Paths.get(DST_INT));
            Files.createDirectories(Paths.get(DST_EXT));
        } catch (IOException e) {
            System.err.println("Error creating destination directories: " + e.getMessage());
            return;
        }

        String palRuta = Paths.get(SRC, "bg_tiles.pal").toString();
        Map<String, Map<String, List<int[]>>> todasPaletas;
        try {
            todasPaletas = colorizer.parsearPaleta(palRuta);
            System.out.println("Paletas cargadas: " + todasPaletas.keySet() + "\n");
        } catch (IOException e) {
            System.err.println("Error parsing palette file: " + e.getMessage());
            return;
        }

        int ok = 0;
        for (TilesetConfig config : TILESETS) {
            String rutaPng = Paths.get(SRC, config.png()).toString();
            String rutaPal = Paths.get(SRC, config.palMap()).toString();

            if (!Files.exists(Paths.get(rutaPng))) {
                System.out.println("  [SKIP] " + config.png() + " — no encontrado");
                continue;
            }
            if (!Files.exists(Paths.get(rutaPal))) {
                System.out.println("  [SKIP] " + config.png() + " — falta " + config.palMap());
                continue;
            }

            Map<String, List<int[]>> setPal = todasPaletas.get(config.tod());
            if (setPal == null) {
                setPal = todasPaletas.get("day"); // Fallback to "day" if specific time-of-day not found
            }
            if (setPal == null) {
                System.err.println("  [ERR] No se encontró paleta para '" + config.tod() + "' ni 'day' para " + config.png());
                continue;
            }

            try {
                BufferedImage img = colorizer.colorizar(rutaPng, rutaPal, setPal, 2);
                String outPath = Paths.get(config.destino(), config.nombreSalida()).toString();
                ImageIO.write(img, "PNG", new File(outPath));
                System.out.printf("  [OK] %s → %d×%dpx (%s)\n", config.nombreSalida(), img.getWidth(), img.getHeight(), config.tod());
                ok++;
            } catch (IOException e) {
                System.err.println("  [ERR] " + config.png() + ": " + e.getMessage());
            }
        }

        System.out.printf("\n✓ %d/%d tilesets procesados.\n", ok, TILESETS.size());
        System.out.println("Interiores → " + DST_INT);
        System.out.println("Exteriores → " + DST_EXT);
    }
}