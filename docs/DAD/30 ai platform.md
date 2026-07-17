# Data Architecture Document (DAD)

# Parte XXX

# AI Platform & Intelligent Automation

Versión 1.0

---

# Tabla de Contenido

1. Objetivo
2. Arquitectura IA
3. AI Gateway
4. AI Agents
5. RAG Platform
6. Model Strategy
7. AI Use Cases
8. Cost Optimization
9. AI Security
10. Modelo de Datos
11. KPIs

---

# 1. Objetivo

Crear una plataforma de inteligencia artificial para automatizar procesos financieros y mejorar experiencia del cliente.

---

# 2. Arquitectura IA

```

Applications

      │

      ▼

AI Gateway

      │

      ├──────── LLM Providers

      │

      ├──────── Vector Database

      │

      ├──────── Tools

      │

      └──────── Memory


```

---

# 3. AI Gateway

Capa central para controlar modelos.

Funciones:

- selección modelo;
- costos;
- seguridad;
- logging;
- fallback.

---

Ejemplo:

Pregunta simple:

```
¿Cuándo vence mi cuota?

```

Usar:

Modelo económico.

---

Pregunta compleja:

```
Explícame mi contrato

```

Usar:

Modelo avanzado.

---

# 4. AI Agents

La fintech tendrá agentes especializados.

---

# Customer Agent

Atiende clientes.

Funciones:

- solicitar préstamo;
- responder dudas;
- consultar estado;
- generar QR.

---

# Collection Agent

Cobranza.

Funciones:

- recordatorios;
- negociación;
- seguimiento.

---

# Credit Analyst Agent

Ayuda analistas.

Funciones:

- resumir solicitudes;
- analizar documentos;
- explicar riesgos.

---

# Compliance Agent

Funciones:

- revisar reglas;
- detectar inconsistencias.

---

# Support Agent

Funciones:

- resolver problemas;
- crear tickets.

---

# 5. RAG Platform

La IA necesita conocimiento empresarial.

No entrenar modelos al inicio.

Usar:

RAG.

---

Arquitectura:

```

Documentos

   ↓

Chunking

   ↓

Embeddings

   ↓

Vector Database

   ↓

Retriever

   ↓

LLM


```

---

Fuentes:

- contratos;
- políticas;
- preguntas frecuentes;
- reglamentos;
- manuales.

---

# Vector Database

Opciones:

- PostgreSQL + pgvector
- ChromaDB
- Qdrant
- Weaviate

---

# 6. Model Strategy

No usar un modelo para todo.

---

# Conversación cliente

Opciones:

- GPT
- Claude
- Gemini

---

# Bajo costo

Opciones:

- DeepSeek
- Qwen
- Mistral

---

# Documentos

Modelos multimodales:

- GPT Vision
- Claude Vision
- Gemini Vision

---

# Embeddings

Opciones:

- OpenAI embeddings
- BGE
- MiniLM

---

# 7. Casos de Uso

---

# WhatsApp Loan Assistant

Flujo:

Cliente:

"Necesito 5000"


IA:

Calcula opciones.


---

# Document AI

Extraer:

- carnet;
- contratos;
- comprobantes.

---

# Fraud Detection

Detectar patrones.

---

# Collection Intelligence

Predecir mora.

---

# Financial Education

Asistente financiero.

---

# Internal Copilot

Ayuda empleados.

---

# 8. Cost Optimization

Principio:

No usar modelos caros siempre.

---

# Modelo Router

Ejemplo:

```

Pregunta simple

↓

DeepSeek


Pregunta compleja

↓

Claude


Documento legal

↓

GPT Vision


```

---

# Caché IA

Guardar respuestas frecuentes.

---

# Context Optimization

No enviar documentos completos.

Usar RAG.

---

# Batch Processing

Procesar tareas no urgentes.

---

# 9. AI Security

---

# Protección datos

No enviar información sensible sin protección.

---

# PII Masking

Antes de llamar IA:

Carnet:

******1234

---

# Prompt Injection Defense

Evitar instrucciones maliciosas.

---

# AI Audit

Registrar:

- modelo;
- prompt;
- respuesta;
- costo.

---

# 10. Modelo de Datos

---

# ai_models

Modelos disponibles.

---

# ai_requests

Solicitudes IA.

Campos:

model

tokens

cost

latency

---

# ai_conversations

Conversaciones.

---

# ai_messages

Mensajes.

---

# ai_agents

Agentes.

---

# ai_tools

Herramientas disponibles.

---

# ai_memory

Memoria cliente.

---

# ai_embeddings

Información vectorial.

---

# ai_documents

Documentos procesados.

---

# ai_prompts

Versiones prompts.

---

# ai_evaluations

Evaluación calidad.

---

# Modelo Total

1 ai_models

2 ai_requests

3 ai_conversations

4 ai_messages

5 ai_agents

6 ai_tools

7 ai_memory

8 ai_embeddings

9 ai_documents

10 ai_prompts

11 ai_evaluations


Total:

11 tablas

---

# 11. Eventos

AIRequestCreated

AIResponseGenerated

DocumentProcessed

AgentExecuted

PromptUpdated

AIErrorDetected

---

# 12. KPIs

Costo IA diario.

Costo por cliente.

Tiempo respuesta.

Satisfacción.

Resolución automática.

Precisión.

---

# Tecnologías recomendadas

## Backend

NestJS

LangChain

LangGraph


## Vector

pgvector

Qdrant


## LLM

Claude

GPT

Gemini

DeepSeek

Qwen


## Local/Futuro

Ollama

vLLM


---

# Próximo Documento

DAD-31

Credit Risk & Scoring Platform

Incluye:

- motor de crédito;
- scoring;
- reglas;
- modelos ML;
- riesgo;
- aprobación automática;
- límites.