'use client';

import React, { useState, useRef } from 'react';
import styles from './ImportarPanelesModal.module.css';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { usePanelStore } from '@/store/usePanelStore';

interface ImportarPanelesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FilaValida {
  codigo: string;
  distrito: string;
  direccion: string;
  empresa: string;
  tipoEPE: string;
  materialPredominante: string;
  caracteristicaTecnica: string;
  tipoVia: string;
  espacioPublicitario: string;
  estadoContrato: string;
  numeroContrato: string;
  registroFRAP: string;
  areaExhibicion: number | null;
  areaOcupacion: number | null;
  alturaPoste: number | null;
  alto: number | null;
  largo: number | null;
  espesor: number | null;
  latitud: number;
  longitud: number;
  fechaSuscripcion: string | null;
  fechaVencimiento: string | null;
}

export default function ImportarPanelesModal({ isOpen, onClose }: ImportarPanelesModalProps) {
  const fetchData = usePanelStore((state) => state.fetchData);
  const [file, setFile] = useState<File | null>(null);
  const [filasValidas, setFilasValidas] = useState<FilaValida[]>([]);
  const [errores, setErrores] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setFile(null);
    setFilasValidas([]);
    setErrores([]);
    setIsProcessing(false);
    setIsUploading(false);
    setUploadSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const parseKML = (text: string): FilaValida[] => {
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const placemarks = Array.from(xml.querySelectorAll('Placemark'));
    const parsed: FilaValida[] = [];

    placemarks.forEach((pm, idx) => {
      const name = pm.querySelector('name')?.textContent?.trim() || `KML_PANEL_${idx + 1}`;
      const coordsText = pm.querySelector('coordinates')?.textContent?.trim() || '';
      const parts = coordsText.split(/[\s,]+/);

      if (parts.length >= 2) {
        let lng = parseFloat(parts[0]);
        let lat = parseFloat(parts[1]);

        // Inversión si [lat, lng]
        if (Math.abs(lng) < 40 && Math.abs(lat) > 40) {
          const temp = lng;
          lng = lat;
          lat = temp;
        }

        if (!isNaN(lat) && !isNaN(lng)) {
          parsed.push({
            codigo: name,
            distrito: 'LIMA',
            direccion: '',
            empresa: '',
            tipoEPE: 'Panel simple',
            materialPredominante: 'Fierro / Metal',
            caracteristicaTecnica: 'Sin Iluminación',
            tipoVia: 'Avenida',
            espacioPublicitario: 'Bienes de Uso Público',
            estadoContrato: 'sin_dato',
            numeroContrato: '',
            registroFRAP: '',
            areaExhibicion: null,
            areaOcupacion: null,
            alturaPoste: null,
            alto: null,
            largo: null,
            espesor: null,
            latitud: lat,
            longitud: lng,
            fechaSuscripcion: null,
            fechaVencimiento: null,
          });
        }
      }
    });

    return parsed;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsProcessing(true);
    setErrores([]);
    setFilasValidas([]);
    setUploadSuccess(false);

    try {
      const fileName = selectedFile.name.toLowerCase();

      if (fileName.endsWith('.kml')) {
        const text = await selectedFile.text();
        const kmlFilas = parseKML(text);
        if (kmlFilas.length === 0) {
          setErrores(['El archivo KML no contiene elementos <Placemark> con coordenadas válidas.']);
        } else {
          setFilasValidas(kmlFilas);
        }
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const buffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const jsonRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (jsonRows.length === 0) {
          setErrores(['El archivo Excel está vacío o sin registros legibles.']);
          setIsProcessing(false);
          return;
        }

        const validas: FilaValida[] = [];
        const errList: string[] = [];

        jsonRows.forEach((row, idx) => {
          const filaNum = idx + 2;
          // Buscar campos flexibles
          const codigo = String(row['CODIGO'] || row['Código'] || row['Codigo'] || '').trim();
          let lat = parseFloat(String(row['LATITUD'] || row['Latitud'] || row['Lat'] || '').replace(',', '.'));
          let lng = parseFloat(String(row['LONGITUD'] || row['Longitud'] || row['Lon'] || row['Lng'] || '').replace(',', '.'));

          if (!codigo) {
            errList.push(`Fila ${filaNum}: Falta el Código identificador del panel.`);
            return;
          }

          if (isNaN(lat) || isNaN(lng)) {
            errList.push(`Fila ${filaNum} (${codigo}): Coordenadas no válidas o vacías.`);
            return;
          }

          // Corrección si están invertidas [lng, lat]
          if (Math.abs(lat) > 40 && Math.abs(lng) < 40) {
            const temp = lat;
            lat = lng;
            lng = temp;
          }

          validas.push({
            codigo,
            distrito: String(row['DISTRITO'] || row['Distrito'] || 'LIMA').trim().toUpperCase(),
            direccion: String(row['DIRECCION'] || row['Dirección'] || row['Direccion'] || '').trim(),
            empresa: String(row['EMPRESA'] || row['Empresa'] || '').trim(),
            tipoEPE: String(row['TIPO EPE'] || row['Tipo EPE'] || 'Panel simple').trim(),
            materialPredominante: String(row['MATERIAL PREDOMINANTE'] || row['Material'] || 'Fierro / Metal').trim(),
            caracteristicaTecnica: String(row['CARACTERISTICAS TÉCNICAS'] || row['Iluminación'] || 'Sin Iluminación').trim(),
            tipoVia: String(row['TIPO DE VIA'] || row['Tipo de Vía'] || 'Avenida').trim(),
            espacioPublicitario: String(row['ESPACIO PUBLICITARIO'] || row['Espacio'] || 'Bienes de Uso Público').trim(),
            estadoContrato: 'sin_dato',
            numeroContrato: String(row['N° CONTRATO'] || row['Contrato'] || '').trim(),
            registroFRAP: String(row['N° REGISTRO FRAP'] || row['FRAP'] || '').trim(),
            areaExhibicion: parseFloat(row['AREA DE EXIBICION'] || row['Área Exhibición']) || null,
            areaOcupacion: parseFloat(row['AREA DE OCUPACION'] || row['Área Ocupación']) || null,
            alturaPoste: parseFloat(row['ALTURA DE POSTE'] || row['Altura Poste']) || null,
            alto: parseFloat(row['ALTO'] || row['Alto']) || null,
            largo: parseFloat(row['LARGO'] || row['Largo']) || null,
            espesor: parseFloat(row['ESPESOR'] || row['Espesor']) || null,
            latitud: lat,
            longitud: lng,
            fechaSuscripcion: null,
            fechaVencimiento: null,
          });
        });

        if (errList.length > 0 && validas.length === 0) {
          setErrores(errList.slice(0, 5));
        } else {
          setFilasValidas(validas);
          if (errList.length > 0) {
            setErrores([`Se detectaron ${errList.length} filas con omisiones que se ignorarán.`]);
          }
        }
      } else {
        setErrores(['Formato no soportado. Por favor selecciona un archivo .xlsx, .xls o .kml.']);
      }
    } catch (err: any) {
      setErrores([`Error procesando archivo: ${err.message}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmUpload = async () => {
    if (filasValidas.length === 0) return;
    setIsUploading(true);

    try {
      // 1. Obtener empresas para relacionar
      const { data: empresasExistentes } = await supabase.from('empresas').select('id, razon_social');
      const empresaMap = new Map((empresasExistentes || []).map((e: any) => [e.razon_social.toUpperCase().trim(), e.id]));

      // 2. Pre-crear empresas faltantes
      const empresasNuevas = new Set<string>();
      filasValidas.forEach(f => {
        if (f.empresa && !empresaMap.has(f.empresa.toUpperCase().trim())) {
          empresasNuevas.add(f.empresa.trim());
        }
      });

      if (empresasNuevas.size > 0) {
        const toInsert = Array.from(empresasNuevas).map(r => ({ razon_social: r }));
        const { data: inserted } = await supabase.from('empresas').insert(toInsert).select('id, razon_social');
        (inserted || []).forEach((e: any) => empresaMap.set(e.razon_social.toUpperCase().trim(), e.id));
      }

      // 3. Preparar filas para inserción en Supabase
      const payload = filasValidas.map(f => ({
        codigo: f.codigo,
        distrito: f.distrito,
        direccion: f.direccion || null,
        tipo_via: f.tipoVia || null,
        espacio_publicitario: f.espacioPublicitario || null,
        caracteristica_tecnica: f.caracteristicaTecnica || null,
        material_predominante: f.materialPredominante || null,
        area_exhibicion: f.areaExhibicion,
        area_ocupacion: f.areaOcupacion,
        altura_poste: f.alturaPoste,
        alto: f.alto,
        largo: f.largo,
        espesor: f.espesor,
        numero_contrato: f.numeroContrato || null,
        registro_frap: f.registroFRAP || null,
        latitud: f.latitud,
        longitud: f.longitud,
        empresa_id: f.empresa ? empresaMap.get(f.empresa.toUpperCase().trim()) || null : null,
      }));

      // Inserción en bloques de 100
      for (let i = 0; i < payload.length; i += 100) {
        const batch = payload.slice(i, i + 100);
        const { error } = await supabase.from('paneles').upsert(batch, { onConflict: 'codigo' });
        if (error) throw error;
      }

      setUploadSuccess(true);
      await fetchData();
      setTimeout(() => {
        onClose();
        resetState();
      }, 1500);
    } catch (err: any) {
      setErrores([`Error al sincronizar con Supabase: ${err.message}`]);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>Importación de Paneles (Excel / KML)</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar modal">✕</button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.dropZone} onClick={() => fileInputRef.current?.click()}>
            <input
              ref={fileInputRef.current ? undefined : fileInputRef}
              type="file"
              accept=".xlsx,.xls,.kml"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="1.8">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <polyline points="9 15 12 12 15 15" />
            </svg>
            <div className={styles.dropText}>
              <strong>Haz clic para seleccionar o arrastra un archivo</strong>
              <span>Soporta Microsoft Excel (.xlsx, .xls) y Google Earth (.kml)</span>
            </div>
            {file && <div className={styles.fileNameBadge}>📄 {file.name}</div>}
          </div>

          {isProcessing && <div className={styles.statusMsg}>Analizando y validando estructura cartográfica...</div>}

          {errores.length > 0 && (
            <div className={styles.errorBox}>
              {errores.map((err, i) => (
                <div key={i}>⚠️ {err}</div>
              ))}
            </div>
          )}

          {filasValidas.length > 0 && !uploadSuccess && (
            <div className={styles.previewBox}>
              <div className={styles.previewSummary}>
                ✅ <strong>{filasValidas.length} paneles listos</strong> para sincronización con Supabase.
              </div>
              <div className={styles.previewList}>
                {filasValidas.slice(0, 5).map((f, i) => (
                  <div key={i} className={styles.previewItem}>
                    <span className={styles.previewCode}>{f.codigo}</span>
                    <span>{f.distrito} · [{f.latitud.toFixed(4)}, {f.longitud.toFixed(4)}]</span>
                  </div>
                ))}
                {filasValidas.length > 5 && (
                  <div style={{ fontSize: '11px', color: '#64748B', textAlign: 'center', marginTop: 4 }}>
                    y {filasValidas.length - 5} paneles adicionales...
                  </div>
                )}
              </div>
            </div>
          )}

          {uploadSuccess && (
            <div className={styles.successBox}>
              🎉 ¡Importación completada! Los paneles se han sincronizado con la base de datos oficial.
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={isUploading}>
            Cancelar
          </button>
          <button
            className={styles.confirmBtn}
            onClick={handleConfirmUpload}
            disabled={filasValidas.length === 0 || isUploading || uploadSuccess}
          >
            {isUploading ? 'Sincronizando...' : `Sincronizar ${filasValidas.length} Paneles`}
          </button>
        </div>
      </div>
    </div>
  );
}
