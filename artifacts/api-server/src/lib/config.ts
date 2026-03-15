import fs from "fs";
import path from "path";

const CONFIG_PATHS = [
  process.env.ADMIN_CONFIG_PATH || "",
  "/opt/odoo17/admin-config.json",
  path.resolve(process.cwd(), "admin-config.json"),
].filter(Boolean);

export interface GrupoConfig {
  nombre: string;
  numAlumnos: number;
  dbPrefix: string;
  passwordPrefix: string;
  profesorNombre: string;
  profesorUsuario: string;
  profesorPassword: string;
}

export interface BrandingConfig {
  companyName: string;
  companyTagline: string;
  companyWebsite: string;
  companyEmail: string;
  companyPhone: string;
  companyStreet: string;
  companyCity: string;
  companyZip: string;
  companyState: string;
  companyCountry: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  fiscalRegime: string;
  fiscalRecargo: boolean;
  verifactuEnabled: boolean;
  verifactuEnvironment: string;
  verifactuNifTitular: string;
  verifactuRazonSocial: string;
  verifactuNifRepresentante: string;
}

export interface AdminConfig {
  superadmin: {
    username: string;
    password: string;
  };
  grupos: GrupoConfig[];
  branding: BrandingConfig;
  odoo: {
    version: string;
    port: number;
    adminPassword: string;
    dbUser: string;
    dbPassword: string;
    dbHost: string;
    dbPort: number;
    home: string;
    confPath: string;
  };
}

const DEFAULT_CONFIG: AdminConfig = {
  superadmin: {
    username: "superadmin",
    password: "SuperAdmin2024!",
  },
  grupos: [
    {
      nombre: "Grupo 1",
      numAlumnos: 30,
      dbPrefix: "empresa",
      passwordPrefix: "alumno",
      profesorNombre: "Profesor",
      profesorUsuario: "profesor",
      profesorPassword: "Profesor2024!",
    },
  ],
  branding: {
    companyName: "Centro de Formación Profesional",
    companyTagline: "Formación de calidad",
    companyWebsite: "",
    companyEmail: "",
    companyPhone: "",
    companyStreet: "",
    companyCity: "",
    companyZip: "",
    companyState: "",
    companyCountry: "ES",
    logoUrl: "",
    faviconUrl: "",
    primaryColor: "#714B67",
    secondaryColor: "#21b6a8",
    fiscalRegime: "iva",
    fiscalRecargo: false,
    verifactuEnabled: false,
    verifactuEnvironment: "test",
    verifactuNifTitular: "",
    verifactuRazonSocial: "",
    verifactuNifRepresentante: "",
  },
  odoo: {
    version: "17.0",
    port: 8069,
    adminPassword: "",
    dbUser: "odoo17",
    dbPassword: "",
    dbHost: "localhost",
    dbPort: 5432,
    home: "/opt/odoo17",
    confPath: "/etc/odoo17.conf",
  },
};

export function getConfigPath(): string {
  for (const p of CONFIG_PATHS) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return CONFIG_PATHS[CONFIG_PATHS.length - 1];
}

export function readConfig(): AdminConfig {
  const configPath = getConfigPath();
  try {
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, "utf-8");
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (e) {
  }
  return { ...DEFAULT_CONFIG };
}

export function writeConfig(config: AdminConfig): void {
  const configPath = getConfigPath();
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), { encoding: "utf-8", mode: 0o600 });
}
