# Conciliação por importação de PDF (desativada)

Versão antiga da tela de Conciliação, que lia a fatura Mastercard em PDF via
`scripts/process-pdf.py`. Foi substituída pela conciliação a partir das compras
lançadas manualmente no cartão de crédito.

Os arquivos têm extensão `.txt` para não serem compilados nem expostos como rota.
A rota `route.ts` montava um comando de shell com a senha do PDF (injeção de comandos):
não reative sem trocar `exec` por `execFile`.
