/* Programas de ejemplo para probar el analizador */
(function () {
  'use strict';
  const McC = window.McC;
  McC.EJEMPLOS = [
    {
      name: 'notas.js', lang: 'js', src: `// Clasifica una calificación y calcula estadísticas
function clasificarNota(nota) {
  if (nota < 0 || nota > 100) {
    throw new Error("Nota inválida");
  }
  if (nota >= 90) {
    return "Excelente";
  } else if (nota >= 75) {
    return "Bueno";
  } else if (nota >= 60) {
    return "Aceptable";
  }
  return "Reprobado";
}

function promedio(notas) {
  let suma = 0;
  for (const n of notas) {
    suma += n;
  }
  return notas.length > 0 ? suma / notas.length : 0;
}

function busquedaBinaria(lista, objetivo) {
  let inicio = 0, fin = lista.length - 1;
  while (inicio <= fin) {
    const medio = Math.floor((inicio + fin) / 2);
    if (lista[medio] === objetivo) return medio;
    if (lista[medio] < objetivo) inicio = medio + 1;
    else fin = medio - 1;
  }
  return -1;
}
`,
    },
    {
      name: 'cuenta.py', lang: 'py', src: `def es_primo(n):
    if n < 2:
        return False
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            return False
    return True


def tipo_triangulo(a, b, c):
    if a <= 0 or b <= 0 or c <= 0:
        raise ValueError("Lados inválidos")
    if a == b and b == c:
        return "equilátero"
    elif a == b or b == c or a == c:
        return "isósceles"
    else:
        return "escaleno"


class Cuenta:
    def __init__(self, saldo=0):
        self.saldo = saldo

    def retirar(self, monto):
        try:
            if monto <= 0:
                raise ValueError("Monto inválido")
            if monto > self.saldo:
                return False
            self.saldo -= monto
            return True
        except ValueError as e:
            print(e)
            return False
`,
    },
    {
      name: 'Tienda.java', lang: 'java', src: `public class Tienda {

    public double calcularDescuento(double total, String tipoCliente, boolean temporada) {
        double descuento = 0;
        switch (tipoCliente) {
            case "VIP":
                descuento = 0.20;
                break;
            case "FRECUENTE":
                descuento = 0.10;
                break;
            default:
                descuento = 0;
        }
        if (temporada && total > 100) {
            descuento += 0.05;
        }
        return total * (1 - descuento);
    }

    public int contarPares(int[] datos) {
        int c = 0;
        for (int i = 0; i < datos.length; i++) {
            if (datos[i] % 2 == 0) {
                c++;
            }
        }
        return c;
    }
}
`,
    },
    {
      name: 'burbuja.c', lang: 'c', src: `#include <stdio.h>

void burbuja(int v[], int n) {
    int i, j, aux;
    for (i = 0; i < n - 1; i++) {
        for (j = 0; j < n - i - 1; j++) {
            if (v[j] > v[j + 1]) {
                aux = v[j];
                v[j] = v[j + 1];
                v[j + 1] = aux;
            }
        }
    }
}

int main(void) {
    int datos[] = {5, 3, 8, 1};
    int n = 4, i = 0;
    burbuja(datos, n);
    do {
        printf("%d ", datos[i]);
        i++;
    } while (i < n);
    return 0;
}
`,
    },
  ];
})();
