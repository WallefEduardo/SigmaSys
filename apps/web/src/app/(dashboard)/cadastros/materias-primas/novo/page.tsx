"use client"

import { MaterialForm } from '../components/material-form'

export default function NovoMaterialPage() {
  const handleSubmit = (data: any) => {
    console.log('Material data:', data)
    // TODO: Integrar com API real
    alert('Material cadastrado com sucesso! (Mock)')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nova Matéria-Prima</h1>
        <p className="text-muted-foreground">
          Cadastre uma nova matéria-prima no sistema
        </p>
      </div>
      
      <MaterialForm onSubmit={handleSubmit} />
    </div>
  )
}