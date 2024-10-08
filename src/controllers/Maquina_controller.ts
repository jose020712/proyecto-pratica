import Maquina from "../models/Maquina";

import { Request, Response } from "express";
import finder_service from "../services/finder_service";

const crearMaquina = async (req: Request, res: Response) => {
  if (
    !req.body.name ||
    !req.body.id_Departamento ||
    !req.body.direccion_ip ||
    !req.body.direccion_mac
  )
    return res.status(400).json({
      status: "error",
      message: "Rellene los campos",
    });
  try {
    const response = await Maquina.findOne({
      $or: [
        { name: req.body.name },
        { direccion_ip: req.body.direccion_ip },
        { direccion_mac: req.body.direccion_mac },
      ],
    });
    if (response)
      return res.status(400).json({
        status: "error",
        error: "Maquina ya existente",
      });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      error: error.message,
    });
  }

  const maquina = new Maquina(req.body);

  await maquina.save().catch((error: any) => {
    return res.status(500).json({
      status: "error",
      error: error.message,
    });
  });
  return res.status(200).json({
    status: "success",
    message: `Se ha creado el maquina ${maquina.name}`,
  });
};

const leerMaquinas = async (_req: Request, res: Response) => {
  try {
    const response = await Maquina.find()
      .select({ __v: 0 })
      .populate("id_Departamento", "-__v");

    //Para popular otra propiedad dentro de otra referencia
    // const response = await Maquina.find()
    // .select({ __v: 0 })
    // .populate({
    //     path: "id_Departamento",
    //     select: "-__v",
    //     populate: {
    //         path: "id_dependency",
    //         select: "-__v"
    //     }
    // });

    if (response.length < 1)
      return res.status(404).json({
        status: "error",
        message: "No se han encontrado maquinas almacenadas",
      });

    return res.status(200).json({
      status: "success",
      maquinas: response,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const leerMaquinasById = async (req: Request, res: Response) => {
  try {
    const response = await Maquina.findOne({ _id: req.params.id })
      .select({ __v: 0 })
      .populate("id_Departamento", "-__v");

    //Para sacar todo lo q esta dentro populado
    /*
        const response = await Maquina.findOne({_id: req.params.id})
        .select({__v: 0})
        .populate({
            path: "id_Departamento",
            select: "-__v",
            populate: {
            path:"id_dependency",
            select: "-__v" 
            }
        }) 
        */

    if (!response)
      return res.status(404).json({
        status: "error",
        message: "No se han encontrado maquinas almacenados",
        response,
      });

    return res.status(200).json({
      status: "success",
      maquinas: response,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const actualizarMaquina = async (req: Request, res: Response) => {
  if (!!req.body)
    return res.status(400).json({
      status: "error",
      message: `Peticion incorrecta no se ha mandado ningun dato`,
    });

  try {
    const [old_response, existingPC] = await Promise.allSettled([
      Maquina.findOne({ _id: req.params.id }).select({ _id: 0, __v: 0 }),

      Maquina.findOne({
        $or: [
          { name: req.body.name },
          { direccion_ip: req.body.direccion_ip },
          { direccion_mac: req.body.direccion_mac },
        ],
      }),
    ]);

    if (old_response.status !== "fulfilled")
      throw new Error("Error old_response en BD");
    if (existingPC.status !== "fulfilled")
      throw new Error("Error existingPC en BD");

    if (!existingPC.value)
      return res.status(400).json({
        status: "error",
        message: `Ya existe  en la BD `,
      });

    if (!old_response.value)
      return res.status(404).json({
        status: "error",
        message: "No se ha encontrado",
      });

    if (req.body === old_response)
      return res.status(400).json({
        status: "Error",
        message: `Peticion incorrecta ha agregado el mismo nombre ya existente`,
      });
    const updateMaquina = req.body;
    if (!updateMaquina.name || updateMaquina.name === old_response.value.name)
      delete updateMaquina.name;
    if (
      !updateMaquina.id_Departamento ||
      updateMaquina.id_Departamento === old_response.value.id_Departamento
    )
      delete updateMaquina.id_Departamento;
    if (
      !updateMaquina.direccion_ip ||
      updateMaquina.direccion_ip === old_response.value.direccion_ip
    )
      delete updateMaquina.direccion_ip;
    if (
      !updateMaquina.direccion_mac ||
      updateMaquina.direccion_mac === old_response.value.direccion_mac
    )
      delete updateMaquina.direccion_mac;

    const new_response = await Maquina.findByIdAndUpdate(
      { _id: req.params.id },
      updateMaquina,
      { new: true }
    ).select({ _id: 0, __v: 0 });

    return res.status(200).json({
      status: "success",
      message: `Se ha actualizado el Maquina: (${old_response}) a el nuevo Maquina: (${new_response})`,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const borrarMaquina = async (req: Request, res: Response) => {
  try {
    const response = await Maquina.findByIdAndDelete({ _id: req.params.id });

    if (!response)
      return res.status(404).json({
        status: "error",
        message: "No se ha encontrado",
      });

    return res.status(200).json({
      status: "success",
      message: `Se ha eliminado el Maquina: ${response.name}`,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
const finder = async (req: Request, res: Response) => {
  try {
    const response = await finder_service(Maquina, req.params.find);
    return res.status(200).json({
      status: "success",
      data: response,
    });
  } catch (Error: any) {
    return res.status(400).json({
      status: "error",
      error: Error.message,
    });
  }
};

export default {
  crearMaquina,
  leerMaquinas,
  leerMaquinasById,
  actualizarMaquina,
  borrarMaquina,
  finder,
};
