import User from "../models/User";

import { Request, Response } from "express";
import finder_service from "../services/finder_service";

const crearUser = async (req: Request, res: Response) => {
  if (
    !req.body.name ||
    !req.body.apellido_1ro ||
    !req.body.apellido_2do ||
    !req.body.CI
  )
    return res.status(400).json({
      status: "error",
      message: "Rellene los campos",
    });
  try {
    const response = await User.findOne({
      $or: [
        { CI: req.body.CI },
        { correo: req.body.correo },
        { telefono: req.body.telefono },
      ],
    });
    if (response)
      return res.status(400).json({
        status: "error",
        error: "User ya existente",
      });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      error: error.message,
    });
  }

  const user = new User(req.body);

  await user.save().catch((error: any) => {
    return res.status(500).json({
      status: "error",
      error: error.message,
    });
  });
  return res.status(200).json({
    status: "success",
    message: `Se ha creado el user ${user.name}`,
  });
};

const leerUsers = async (_req: Request, res: Response) => {
  try {
    const response = await User.find().select({ __v: 0 });

    if (response.length < 1)
      return res.status(404).json({
        status: "error",
        message: "No se han encontrado users almacenados",
      });

    return res.status(200).json({
      status: "success",
      users: response,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const leerUsersById = async (req: Request, res: Response) => {
  try {
    const response = await User.findOne({ _id: req.params.id }).select({
      __v: 0,
    });

    if (!response)
      return res.status(404).json({
        status: "error",
        message: "No se han encontrado users almacenados",
        response,
      });

    return res.status(200).json({
      status: "success",
      users: response,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const actualizarUser = async (req: Request, res: Response) => {
  if (!!req.body)
    return res.status(400).json({
      status: "error",
      message: `Peticion incorrecta no se han mandado datos`,
    });

  try {
    const [old_response, exist] = await Promise.allSettled([
      User.findOne({ _id: req.params.id }).select({ __v: 0 }),
      User.findOne({
        $or: [
          { CI: req.body.CI },
          { correo: req.body.correo },
          { telefono: req.body.telefono },
        ],
      }),
    ]);

    if (old_response.status !== "fulfilled")
      throw new Error("Error old_response en BD");
    if (exist.status !== "fulfilled") throw new Error("Error exist en BD");

    if (!exist.value)
      return res.status(400).json({
        status: "error",
        message: `Ya existe en la BD `,
      });
    if (!old_response.value)
      return res.status(404).json({
        status: "error",
        message: "No se ha encontrado",
      });

    if (req.body === old_response)
      return res.status(400).json({
        status: "Error",
        message: `Peticion incorrecta ha agregado el mismo user ya existente`,
      });

    const updateUser = req.body;

    if (!updateUser.name || updateUser.name === old_response.value.name)
      delete updateUser.name;
    if (
      !updateUser.apellido_1ro ||
      updateUser.apellido_1ro === old_response.value.apellido_1ro
    )
      delete updateUser.apellido_1ro;
    if (
      !updateUser.apellido_2do ||
      updateUser.apellido_2do === old_response.value.apellido_2do
    )
      delete updateUser.apellido_2do;
    if (!updateUser.CI || updateUser.CI === old_response.value.CI)
      delete updateUser.CI;

    if (!updateUser.correo || updateUser.correo === old_response.value.correo)
      delete updateUser.correo;

    if (
      !updateUser.telefono ||
      updateUser.telefono === old_response.value.telefono
    )
      delete updateUser.telefono;

    const new_response = await User.findByIdAndUpdate(
      { _id: req.params.id },
      updateUser,
      { new: true }
    );

    return res.status(200).json({
      status: "success",
      message: `Se ha actualizado el User: (${old_response.value.name}) a el nuevo User: (${new_response?.name})`,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const borrarUser = async (req: Request, res: Response) => {
  try {
    const response = await User.findByIdAndDelete({ _id: req.params.id });

    if (!response)
      return res.status(404).json({
        status: "error",
        message: "No se ha encontrado",
      });

    return res.status(200).json({
      status: "success",
      message: `Se ha eliminado el User: ${response.name}`,
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
    const response = await finder_service(User, req.params.find);
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
  crearUser,
  leerUsers,
  leerUsersById,
  actualizarUser,
  borrarUser,
  finder,
};
