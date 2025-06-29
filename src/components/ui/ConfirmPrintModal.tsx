--- a/src/components/ui/ConfirmPrintModal.tsx
+++ b/src/components/ui/ConfirmPrintModal.tsx
@@ …  
             <div className="flex gap-3">
-              <Button className="flex-1" onClick={onKeep}>
-                {offline ? 'Continuar offline' : 'Mantener y seguir'}
-              </Button>
-              <Button
-                className="flex-1 bg-neutral-200 text-neutral-800 hover:bg-neutral-300"
-                onClick={onReset}
-              >
-                {offline ? 'Salir modo emergencia' : 'Nueva configuración'}
-              </Button>
+              <Button className="flex-1" onClick={onKeep}>
+                {offline ? 'Continuar offline'      : 'Mantener y seguir'}
+              </Button>
+              <Button
+                className={`flex-1 ${
+                  offline
+                    ? 'bg-neutral-800 text-white hover:bg-neutral-900'   // ← negro+blanco
+                    : 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300'
+                }`}
+                onClick={onReset}
+              >
+                {offline ? 'Salir modo emergencia' : 'Nueva configuración'}
+              </Button>
             </div>
